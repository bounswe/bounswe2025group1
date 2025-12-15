
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.authtoken.models import Token


class SuspensionMiddleware:

    ALLOWED_PATHS = [
        '/api/auth/logout/',
        '/api/suspension-status/',
        '/api/profile/',  # Allow profile access to get suspension info
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = self._get_user_from_token(request)

        if user and user.is_authenticated:
            if hasattr(user, 'profile') and user.profile.is_suspended:
                if user.profile.suspended_until and user.profile.suspended_until <= timezone.now():
                    user.profile.is_suspended = False
                    user.profile.suspension_reason = None
                    user.profile.suspended_until = None
                    user.profile.save()
                else:
                    if not self._is_path_allowed(request.path):
                        return JsonResponse({
                            'error': 'suspended',
                            'message': 'Your account is suspended.',
                            'suspension_reason': user.profile.suspension_reason,
                            'suspended_until': user.profile.suspended_until.isoformat() if user.profile.suspended_until else None,
                        }, status=403)

        return self.get_response(request)

    def _get_user_from_token(self, request):
        """Extract user from Authorization header token."""
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.select_related('user', 'user__profile').get(key=token_key)
                return token.user
            except Token.DoesNotExist:
                pass

        return None

    def _is_path_allowed(self, path):
        """Check if the path is in the allowed list for suspended users."""
        for allowed_path in self.ALLOWED_PATHS:
            if path.startswith(allowed_path):
                return True
        return False
