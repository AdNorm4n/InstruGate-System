# Generated by Django 4.2.7 on 2025-05-06 14:17

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0011_delete_quotation'),
    ]

    operations = [
        migrations.CreateModel(
            name='Quotation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('project_name', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='quotations', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='QuotationInstrument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('product_code', models.CharField(max_length=100)),
                ('addons', models.ManyToManyField(blank=True, to='api.addon')),
                ('instrument', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.instrument')),
                ('quotation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='instruments', to='api.quotation')),
                ('selections', models.ManyToManyField(blank=True, to='api.fieldoption')),
            ],
        ),
    ]
