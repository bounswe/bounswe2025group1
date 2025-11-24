# forum/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.contenttypes.models import ContentType
from ..models import Report
from ..serializers import ReportSerializer
from ..permissions import IsMember, IsSystemAdministrator, IsModerator

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer

    def get_permissions(self):
        """
        Return permissions based on action.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsSystemAdministrator]  # only admins can view reports
        elif self.action == 'create':
            permission_classes = [IsMember]  # only members can report
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsSystemAdministrator]  # only managers/admins
        else:
            permission_classes = [IsMember]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        content_type_str = request.data.get('content_type')
        object_id = request.data.get('object_id')
        reason = request.data.get('reason')
        description = request.data.get('description', '')

        try:
            content_type = ContentType.objects.get(model=content_type_str.lower())
        except ContentType.DoesNotExist:
            return Response({'detail': 'Invalid content type.'}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent duplicate reports by the same user
        if Report.objects.filter(reporter=request.user, content_type=content_type, object_id=object_id).exists():
            return Response({'detail': 'You already reported this content.'}, status=status.HTTP_400_BAD_REQUEST)

        report = Report.objects.create(
            reporter=request.user,
            content_type=content_type,
            object_id=object_id,
            reason=reason,
            description=description
        )

        

        return Response({'detail': 'Report submitted successfully.'}, status=status.HTTP_201_CREATED)


class AdminReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all().select_related('reporter')
    serializer_class = ReportSerializer
    permission_classes = [IsModerator]

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        report = self.get_object()
        is_valid = request.data.get('is_valid')

        report.reviewed = True
        report.is_valid = bool(is_valid)
        report.save()

        if report.is_valid:
            obj = report.content_object
            if hasattr(obj, "delete"):
                obj.delete()

        return Response({'detail': 'Report reviewed successfully.'})
