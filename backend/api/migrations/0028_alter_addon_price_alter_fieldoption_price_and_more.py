# Generated by Django 4.2.7 on 2025-06-16 14:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0027_addon_price_fieldoption_price_instrument_base_price'),
    ]

    operations = [
        migrations.AlterField(
            model_name='addon',
            name='price',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10, verbose_name='Base Price (RM/pcs)'),
        ),
        migrations.AlterField(
            model_name='fieldoption',
            name='price',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10, verbose_name='Base Price (RM/pcs)'),
        ),
        migrations.AlterField(
            model_name='instrument',
            name='base_price',
            field=models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Base Price (RM/pcs)'),
        ),
    ]
