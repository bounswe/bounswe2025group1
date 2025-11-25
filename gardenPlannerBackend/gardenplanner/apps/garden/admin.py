from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import Profile, Garden, GardenMembership, CustomTaskType, Task, ForumPost, Comment, Report
from .models import Profile, Garden, GardenMembership, CustomTaskType, Task, ForumPost, Comment, Report, GardenEvent, EventAttendance

# Register your models here.
admin.site.register(Profile)
admin.site.register(Garden)
admin.site.register(GardenMembership)
admin.site.register(CustomTaskType)
admin.site.register(Task)
admin.site.register(GardenEvent)
admin.site.register(EventAttendance)

@admin.register(ForumPost)
class ForumPostAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'created_at', 'is_deleted')
    search_fields = ('title', 'content', 'author__username')
    list_filter = ('created_at', 'is_deleted')
    ordering = ('-created_at',)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'forum_post', 'author', 'created_at', 'is_deleted')
    search_fields = ('content', 'author__username', 'forum_post__title')
    list_filter = ('created_at', 'is_deleted')
    ordering = ('-created_at',)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'reporter',
        'content_type',
        'object_link',
        'reason',
        'reviewed',
        'is_valid',
        'created_at',
    )
    list_filter = ('reviewed', 'is_valid', 'reason', 'content_type')
    search_fields = ('reporter__username', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('reporter', 'content_type', 'object_id', 'created_at')

    actions = ['mark_as_valid', 'mark_as_invalid', 'soft_delete_reported_content']

    def object_link(self, obj):
        """Clickable link to reported content in Admin (if exists)."""
        try:
            model_name = obj.content_type.model
            url = reverse(f"admin:{obj.content_type.app_label}_{model_name}_change", args=[obj.object_id])
            return format_html(f'<a href="{url}">{model_name.capitalize()} #{obj.object_id}</a>')
        except Exception:
            return f"{obj.content_type} #{obj.object_id}"
    object_link.short_description = "Reported Object"

    @admin.action(description="✅ Mark selected reports as valid (harmful content)")
    def mark_as_valid(self, request, queryset):
        for report in queryset:
            report.reviewed = True
            report.is_valid = True
            report.save()
            obj = report.content_object
            if hasattr(obj, "delete"):
                obj.delete()  # Soft delete
        self.message_user(request, "Selected reports marked as valid and content soft deleted.")

    @admin.action(description="❎ Mark selected reports as invalid (harmless)")
    def mark_as_invalid(self, request, queryset):
        queryset.update(reviewed=True, is_valid=False)
        self.message_user(request, "Selected reports marked as invalid.")

    @admin.action(description="🗑 Soft delete reported content (without marking)")
    def soft_delete_reported_content(self, request, queryset):
        for report in queryset:
            obj = report.content_object
            if hasattr(obj, "delete"):
                obj.delete()  # Soft delete
        self.message_user(request, "Reported content soft deleted.")
