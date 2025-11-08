import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from gardenplanner.apps.garden.models import Task, Notification, NotificationCategory


class Command(BaseCommand):
    help = 'Sends notifications for tasks that are nearing their deadline.'

    def handle(self, *args, **options):
        self.stdout.write(f"[{timezone.now()}] Starting deadline reminder check...")
        
        # Define the time window for "nearing deadline" (e.g., the next 24 hours)
        now = timezone.now()
        tomorrow = now + datetime.timedelta(days=1)
        
        # Find tasks that are due within the next 24 hours and are not yet completed or cancelled.
        tasks_nearing_deadline = Task.objects.filter(
            due_date__gte=now,
            due_date__lt=tomorrow,
            status__in=['PENDING', 'IN_PROGRESS', 'ACCEPTED']
        )
        self.stdout.write(f"Found {tasks_nearing_deadline.count()} tasks nearing their deadline.")

        for task in tasks_nearing_deadline:
            # Skip if no one is assigned
            if not task.assigned_to:
                continue
                
            recipient = task.assigned_to
            
            # Stop if the recipient has notifications turned off.
            if not recipient.profile.receives_notifications:
                # Optionally print a message for logging purposes
                self.stdout.write(f"Skipping notification for user '{recipient.username}' (opted out).")
                continue
            
            # Create the notification
            message = f"Reminder: The task '{task.title}' is due on {task.due_date.strftime('%Y-%m-%d %H:%M')}." 
            Notification.objects.create(
                recipient=recipient,
                message=message,
                category=NotificationCategory.TASK,
            )
            
        self.stdout.write(self.style.SUCCESS(f"Successfully sent all deadline reminders."))