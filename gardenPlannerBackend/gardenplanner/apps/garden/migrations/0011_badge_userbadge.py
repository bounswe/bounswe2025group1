
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("garden", "0010_profile_picture_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="Badge",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("key", models.CharField(max_length=64, unique=True)),
                ("name", models.CharField(max_length=100, unique=True)),
                ("description", models.TextField(blank=True)),
                ("category", models.CharField(blank=True, max_length=100)),
                ("requirement", models.JSONField(blank=True, default=dict)),
            ],
        ),
        migrations.CreateModel(
            name="UserBadge",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("earned_at", models.DateTimeField(auto_now_add=True)),
                (
                    "badge",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="holders",
                        to="garden.badge",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="earned_badges",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-earned_at"],
                "unique_together": {("user", "badge")},
            },
        ),
    ]
