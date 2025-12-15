import logging
from django.conf import settings
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django.core.management.base import BaseCommand
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django_apscheduler import util

# --- IMPORT THE WORKER FUNCTION ---
from .send_deadline_reminders import deadline_reminder_sender
from django.core.management import call_command
from .send_weather_reminders import check_weather_and_notify

logger = logging.getLogger(__name__)

def deadline_reminders_job():
    """Wraps the logic function for the scheduler."""
    logger.info("Scheduler: Running deadline reminders...")
    result = deadline_reminder_sender()
    logger.info(f"Scheduler: {result}")

def weather_reminders_job():
    """Sends weather reminders to users."""
    logger.info("Scheduler: Running weather reminders...")
    result = check_weather_and_notify()
    logger.info(f"Scheduler: {result}")

def generate_recurring_tasks_job():
    """Wraps the recurring task generation command for the scheduler."""
    print("Scheduler: Generating recurring task instances...")
    try:
        call_command('generate_recurring_tasks')
        print("Scheduler: Recurring task generation completed.")
    except Exception as e:
        print(f"Scheduler: Error generating recurring tasks: {e}")

@util.close_old_connections
def delete_old_job_executions(max_age=604_800):
    """Deletes old execution logs from the database."""
    DjangoJobExecution.objects.delete_old_job_executions(max_age)

class Command(BaseCommand):
    help = "Runs the APScheduler."

    def handle(self, *args, **options):
        scheduler = BlockingScheduler(timezone=settings.TIME_ZONE)
        scheduler.add_jobstore(DjangoJobStore(), "default")

        # --- SCHEDULE THE JOB ---
        # Run every day at 08:15
        scheduler.add_job(
            deadline_reminders_job,
            trigger=CronTrigger(hour="08", minute="15"),
            # trigger=CronTrigger(minute="*"), # every minute for testing the feature
            id="send_deadline_reminders",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Added job 'send_deadline_reminders'.")

        # Run every day at 21:15
        scheduler.add_job(
            weather_reminders_job,
            trigger=CronTrigger(hour="21", minute="15"),
            # trigger=CronTrigger(minute="*"), # for testing
            id="weather_reminders",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Added job 'weather_reminders'.")

        scheduler.add_job(
            generate_recurring_tasks_job,
            trigger=CronTrigger(hour="08", minute="00"),
            # trigger=CronTrigger(minute="*"), # for testing
            id="generate_recurring_tasks",
            max_instances=1,
            replace_existing=True,
        )
        print("Added job 'generate_recurring_tasks'.")

        # Clean up old logs every week
        scheduler.add_job(
            delete_old_job_executions,
            trigger=CronTrigger(day_of_week="mon", hour="00", minute="00"),
            id="delete_old_job_executions",
            max_instances=1,
            replace_existing=True,
        )

        try:
            logger.info("Starting scheduler...")
            scheduler.start()
        except KeyboardInterrupt:
            logger.info("Stopping scheduler...")
            scheduler.shutdown()