from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('garden', '0008_merge_20251014_2108'),
    ]

    operations = [
        migrations.CreateModel(
            name='GardenImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', models.BinaryField()),
                ('mime_type', models.CharField(default='image/jpeg', max_length=100)),
                ('is_cover', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('garden', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='garden.garden')),
            ],
        ),
        migrations.CreateModel(
            name='ForumPostImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', models.BinaryField()),
                ('mime_type', models.CharField(default='image/jpeg', max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='garden.forumpost')),
            ],
        ),
        migrations.CreateModel(
            name='CommentImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', models.BinaryField()),
                ('mime_type', models.CharField(default='image/jpeg', max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('comment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='garden.comment')),
            ],
        ),
    ]


