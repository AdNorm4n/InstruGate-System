# Generated by Django 4.2.7 on 2025-04-22 06:47

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_configurablefield_fieldoption'),
    ]

    operations = [
        migrations.AddField(
            model_name='configurablefield',
            name='parent_field',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dependent_fields', to='api.configurablefield'),
        ),
        migrations.AddField(
            model_name='configurablefield',
            name='trigger_value',
            field=models.CharField(blank=True, help_text='Only show this field if parent field equals this value', max_length=100, null=True),
        ),
    ]
