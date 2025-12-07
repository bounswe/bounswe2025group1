from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from gardenplanner.apps.garden.models import Task
from django.db import transaction


class Command(BaseCommand):
    help = 'Generate recurring task instances based on parent recurring tasks'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without actually creating tasks',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        now = timezone.now()
        
        parent_tasks = Task.objects.filter(
            is_recurring=True,
            parent_task__isnull=True
        )
        
        created_count = 0
        
        for parent_task in parent_tasks:
            # Check if recurrence has ended
            if parent_task.recurrence_end_date and now > parent_task.recurrence_end_date:
                self.stdout.write(
                    self.style.WARNING(
                        f'Skipping parent task "{parent_task.title}" - recurrence ended'
                    )
                )
                continue

             # Determine the next due date
            
            latest_instance = Task.objects.filter(
                parent_task=parent_task
            ).order_by('-due_date').first()
            
           
            if latest_instance:
                # Use the latest instance's due date as reference
                reference_date = latest_instance.due_date
            else:
                # No instances yet, use parent task's due date
                reference_date = parent_task.due_date
            
            if not reference_date:
                self.stdout.write(
                    self.style.WARNING(
                        f'Skipping parent task "{parent_task.title}" - no due date set'
                    )
                )
                continue
            
            next_due_date = self._calculate_next_due_date(
                reference_date,
                parent_task.recurrence_period
            )

            if next_due_date <= now + timedelta(days=1):
                existing = Task.objects.filter(
                    parent_task=parent_task,
                    due_date__date=next_due_date.date()
                ).exists()
                
                if not existing:
                    if not dry_run:
                        with transaction.atomic():
                            new_task = Task.objects.create(
                                garden=parent_task.garden,
                                title=parent_task.title,
                                description=parent_task.description,
                                task_type=parent_task.task_type,
                                custom_type=parent_task.custom_type,
                                assigned_by=parent_task.assigned_by,
                                assigned_to=parent_task.assigned_to,
                                status='PENDING',
                                due_date=next_due_date,
                                is_recurring=False,  # Instances are not recurring themselves
                                parent_task=parent_task,
                            )
                            created_count += 1
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'Created recurring task instance: "{new_task.title}" '
                                    f'(due: {next_due_date.strftime("%Y-%m-%d %H:%M")})'
                                )
                            )
                    else:
                        created_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'[DRY RUN] Would create task: "{parent_task.title}" '
                                f'(due: {next_due_date.strftime("%Y-%m-%d %H:%M")})'
                            )
                        )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Instance already exists for "{parent_task.title}" '
                            f'on {next_due_date.strftime("%Y-%m-%d")}'
                        )
                    )
        
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(f'\n[DRY RUN] Would create {created_count} task instance(s)')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\nCreated {created_count} recurring task instance(s)')
            )

    def _calculate_next_due_date(self, reference_date, recurrence_period):
        """Calculate the next due date based on recurrence period."""
        period_map = {
            'DAILY': timedelta(days=1),
            'WEEKLY': timedelta(weeks=1),
            'MONTHLY': timedelta(days=30),  
            'YEARLY': timedelta(days=365),
        }
        
        delta = period_map.get(recurrence_period, timedelta(days=1))
        return reference_date + delta
        
