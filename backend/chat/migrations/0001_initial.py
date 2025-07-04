# Generated by Django 5.2.1 on 2025-06-04 15:01

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ChatMessage",
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
                ("room_name", models.CharField(db_index=True, max_length=150)),
                (
                    "sender_type",
                    models.CharField(
                        choices=[("client", "Client"), ("agent", "Agent")],
                        max_length=10,
                    ),
                ),
                ("content", models.TextField()),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                ("is_read", models.BooleanField(default=False)),
                (
                    "sender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sent_messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["timestamp"],
                "indexes": [
                    models.Index(
                        fields=["room_name", "timestamp"],
                        name="chat_chatme_room_na_067b1a_idx",
                    )
                ],
            },
        ),
    ]
