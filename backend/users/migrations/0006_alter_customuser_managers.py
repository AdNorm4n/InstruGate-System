# Generated by Django 4.2.7 on 2025-06-18 16:14

from django.db import migrations
import users.models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_alter_customuser_managers_alter_customuser_company_and_more'),
    ]

    operations = [
        migrations.AlterModelManagers(
            name='customuser',
            managers=[
                ('objects', users.models.CustomUserManager()),
            ],
        ),
    ]
