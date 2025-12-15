"""Views for user authentication including registration, login, logout, and password reset."""

from django.contrib.auth.models import User
from django.contrib.auth import logout
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
import os

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import AnonRateThrottle

from ..serializers import RegisterSerializer, LoginSerializer
from ..models import DeviceFingerprint, LoginOTP
from ..utils import generate_otp, get_device_identifier, get_device_name, get_client_ip


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomLoginView(ObtainAuthToken):
    serializer_class = LoginSerializer
    throttle_classes = [AnonRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # Get device info
        device_id = get_device_identifier(request)
        device_name = get_device_name(request)
        client_ip = get_client_ip(request)

        # Check if device is trusted
        device = DeviceFingerprint.objects.filter(user=user, device_identifier=device_id).first()

        if device and device.is_trusted:
            # Trusted device — issue token directly
            device.last_used = timezone.now()
            device.save()
            token, _ = Token.objects.get_or_create(user=user)

            response_data = {
                'token': token.key,
                'user_id': user.pk,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }

            if hasattr(user, 'profile') and user.profile.is_suspended:
                response_data['is_suspended'] = True
                response_data['suspension_reason'] = user.profile.suspension_reason
                response_data['suspended_until'] = user.profile.suspended_until.isoformat() if user.profile.suspended_until else None
            else:
                response_data['is_suspended'] = False

            return Response(response_data)

        # New/untrusted device — send OTP
        otp_code = generate_otp()
        expires_at = timezone.now() + timedelta(minutes=10)

        # Save OTP
        LoginOTP.objects.create(
            user=user,
            otp_code=otp_code,
            device_identifier=device_id,
            ip_address=client_ip,
            expires_at=expires_at
        )

        # Send email
        try:
            send_mail(
                'Login Verification Code',
                f'Hi {user.username},\n\nYour verification code is: {otp_code}\n\nThis code is valid for 10 minutes.\n\nDevice: {device_name}\nIP: {client_ip}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({'error': 'Failed to send OTP email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Return response indicating OTP required
        return Response({
            'otp_required': True,
            'message': 'New device detected. Verification code sent to your email. Please verify to complete login.',
            'device_identifier': device_id,
            'device_name': device_name,
        }, status=status.HTTP_202_ACCEPTED)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except (AttributeError, Token.DoesNotExist):
            pass

        logout(request)
        return Response({"success": "Successfully logged out."}, status=status.HTTP_200_OK)


class VerifyLoginOTPView(APIView):
    """Verify OTP code for new device login"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        username = request.data.get('username')
        otp_code = request.data.get('otp_code')
        device_identifier = request.data.get('device_identifier')
        trust_device = request.data.get('trust_device', False)

        if not all([username, otp_code, device_identifier]):
            return Response({'error': 'Username, OTP code, and device identifier are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify OTP
        otp = LoginOTP.objects.filter(
            user=user,
            otp_code=otp_code,
            device_identifier=device_identifier,
        ).order_by('-created_at').first()

        if not otp or not otp.is_valid():
            return Response({'error': 'Invalid or expired OTP code.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark OTP as used
        otp.is_used = True
        otp.save()

        # Create/update device as trusted if requested
        if trust_device:
            device_name = get_device_name(request)
            DeviceFingerprint.objects.update_or_create(
                user=user,
                device_identifier=device_identifier,
                defaults={
                    'device_name': device_name,
                    'ip_address': get_client_ip(request),
                    'is_trusted': True,
                }
            )

        # Issue token
        token, _ = Token.objects.get_or_create(user=user)

        response_data = {
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'message': 'Login successful.'
        }

        # Add suspension info
        if hasattr(user, 'profile') and user.profile.is_suspended:
            response_data['is_suspended'] = True
            response_data['suspension_reason'] = user.profile.suspension_reason
            response_data['suspended_until'] = user.profile.suspended_until.isoformat() if user.profile.suspended_until else None
        else:
            response_data['is_suspended'] = False

        return Response(response_data, status=status.HTTP_200_OK)


class SuspensionStatusView(APIView):
    """Returns the suspension status of the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if hasattr(user, 'profile') and user.profile.is_suspended:
            return Response({
                'is_suspended': True,
                'suspension_reason': user.profile.suspension_reason,
                'suspended_until': user.profile.suspended_until.isoformat() if user.profile.suspended_until else None,
            })

        return Response({
            'is_suspended': False,
            'suspension_reason': None,
            'suspended_until': None,
        })


class PasswordResetAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # Generate frontend URL - use same host without port
            host = request.get_host()
            if ':' in host:
                # Remove port from host
                host = host.split(':')[0]
            
            frontend_url = f"{request.scheme}://{host}"
            reset_url = f"{frontend_url}/reset-password/{uid}/{token}/"

            # You can use a template instead of plain string
            message = f"Hi {user.username},\n\nClick the link below to reset your password:\n{reset_url}"

            # Send email
            send_mail(
                'Password Reset Request',
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

            return Response(
                {'message': 'Password reset link has been sent to your email address.'},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            # Not leaking information about whether the email exists
            return Response(
                {'message': 'If a user with this email exists, a password reset link will be sent.'},
                status=status.HTTP_200_OK
            )


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            new_password = request.data.get('new_password')
            if not new_password:
                return Response({'error': 'New password is required.'}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)

        return Response({'error': 'Invalid reset link or it has expired.'}, status=status.HTTP_400_BAD_REQUEST)
