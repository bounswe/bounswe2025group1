from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('garden', '0020_forumpost_best_answer'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='is_recurring',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='task',
            name='recurrence_period',
            field=models.CharField(blank=True, choices=[('DAILY', 'Daily'), ('WEEKLY', 'Weekly'), ('MONTHLY', 'Monthly'), ('YEARLY', 'Yearly')], max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='task',
            name='recurrence_end_date',
            field=models.DateTimeField(blank=True, help_text='When to stop generating recurring instances', null=True),
        ),
        migrations.AddField(
            model_name='task',
            name='parent_task',
            field=models.ForeignKey(blank=True, help_text='Parent task template for recurring tasks', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='recurring_instances', to='garden.task'),
        ),
    ]
