# Generated by Django 4.2.7 on 2025-05-16 17:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_quotation_project_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='quotation',
            name='status',
            field=models.CharField(choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected')], default='Pending', max_length=20),
        ),
    ]
