# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('garden', '0020_forumpost_best_answer'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='is_suspended',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='profile',
            name='is_banned',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='profile',
            name='suspension_reason',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='ban_reason',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='suspended_until',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
