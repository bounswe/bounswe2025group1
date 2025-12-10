# Generated manually for multi-assignee task support

from django.conf import settings
from django.db import migrations, models


def migrate_assignees_forward(apps, schema_editor):
    """Migrate single assignee to many-to-many relationship"""
    Task = apps.get_model('garden', 'Task')
    db_alias = schema_editor.connection.alias
    
    # Get all tasks with assigned_to before field is removed
    tasks_with_assignee = []
    for task in Task.objects.using(db_alias).all():
        if hasattr(task, 'old_assigned_to_id') and task.old_assigned_to_id:
            tasks_with_assignee.append((task.id, task.old_assigned_to_id))
    
    # After M2M field is created, add the assignees
    for task_id, user_id in tasks_with_assignee:
        task = Task.objects.using(db_alias).get(id=task_id)
        task.assigned_to.add(user_id)


def migrate_assignees_backward(apps, schema_editor):
    """Migrate many-to-many back to single assignee (takes first assignee)"""
    Task = apps.get_model('garden', 'Task')
    db_alias = schema_editor.connection.alias
    
    for task in Task.objects.using(db_alias).all():
        assignees = list(task.assigned_to.all())
        if assignees:
            # Take the first assignee when reverting
            task.old_assigned_to = assignees[0]
            task.save()


class Migration(migrations.Migration):

    dependencies = [
        ('garden', '0015_notification_link'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Step 1: Rename the old ForeignKey field
        migrations.RenameField(
            model_name='task',
            old_name='assigned_to',
            new_name='old_assigned_to',
        ),
        
        # Step 2: Create the new ManyToManyField
        migrations.AddField(
            model_name='task',
            name='assigned_to',
            field=models.ManyToManyField(
                blank=True,
                related_name='assigned_tasks',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        
        # Step 3: Migrate data from old field to new field
        migrations.RunPython(
            migrate_assignees_forward,
            migrate_assignees_backward,
        ),
        
        # Step 4: Remove the old field
        migrations.RemoveField(
            model_name='task',
            name='old_assigned_to',
        ),
    ]
