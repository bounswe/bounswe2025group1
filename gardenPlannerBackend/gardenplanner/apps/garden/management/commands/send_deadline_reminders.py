import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from gardenplanner.apps.garden.signals import _send_notification
from gardenplanner.apps.garden.models import Task, NotificationCategory

def deadline_reminder_sender():

    # Define the time window for "nearing deadline" (e.g., the next 24 hours)
    now = timezone.now()
    tomorrow = now + datetime.timedelta(days=1)
    
    # Find tasks that are due within the next 24 hours and are not yet completed or cancelled.
    tasks_nearing_deadline = Task.objects.filter(
        due_date__gte=now,
        due_date__lt=tomorrow,
        status__in=['PENDING', 'IN_PROGRESS', 'ACCEPTED']
    )

    for task in tasks_nearing_deadline:
        # Skip if no one is assigned
        if not task.assigned_to:
            continue
            
        recipient = task.assigned_to
        
        # Stop if the recipient has notifications turned off.
        if not recipient.profile.receives_notifications:
            continue
        
        # Create the notification
        message = f"Reminder: The task '{task.title}' is due on {task.due_date.strftime('%Y-%m-%d %H:%M')}." 

        _send_notification(
            notification_receiver=recipient,
            notification_title="Task Deadline Reminder",
            notification_message=message,
            notification_category=NotificationCategory.TASK,
        )
        

class Command(BaseCommand):
    help = 'Manually send deadline reminders.'

    def handle(self, *args, **options):
        # This allows you to run "python manage.py send_deadline_reminders" manually
        result = deadline_reminder_sender()
        self.stdout.write(self.style.SUCCESS(result))