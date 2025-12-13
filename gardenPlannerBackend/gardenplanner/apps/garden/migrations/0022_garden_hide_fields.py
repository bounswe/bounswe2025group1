# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('garden', '0021_profile_suspension_ban_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='garden',
            name='is_hidden',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='garden',
            name='hidden_reason',
            field=models.TextField(blank=True, null=True),
        ),
    ]
