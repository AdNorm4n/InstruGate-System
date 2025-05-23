# Generated by Django 4.2.7 on 2025-05-20 17:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0025_quotation_approved_at_quotation_project_name_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='instrumenttype',
            name='name',
            field=models.CharField(choices=[('Pressure Gauges', 'Pressure Gauges'), ('Digital Gauges', 'Digital Gauges'), ('High-Purity', 'High-Purity'), ('Test Gauges', 'Test Gauges'), ('Differential Gauges', 'Differential Gauges'), ('Pressure Switches', 'Pressure Switches'), ('Pressure Sensors', 'Pressure Sensors'), ('Diaphragm Seals - Isolators', 'Diaphragm Seals - Isolators'), ('Threaded Seals', 'Threaded Seals'), ('Isolation Rings', 'Isolation Rings'), ('Flanged Seals', 'Flanged Seals'), ('In-Line', 'In-Line'), ('Accessories', 'Accessories'), ('Thermometers', 'Thermometers'), ('Bimetals Thermometers', 'Bimetals Thermometers'), ('Gas Actuated Thermometers', 'Gas Actuated Thermometers'), ('Thermowells', 'Thermowells')], max_length=100),
        ),
        migrations.AlterUniqueTogether(
            name='addon',
            unique_together={('addon_type', 'label', 'code')},
        ),
        migrations.AlterUniqueTogether(
            name='fieldoption',
            unique_together={('field', 'label', 'code')},
        ),
        migrations.AlterUniqueTogether(
            name='quotationitemaddon',
            unique_together={('quotation_item', 'addon')},
        ),
        migrations.AlterUniqueTogether(
            name='quotationitemselection',
            unique_together={('quotation_item', 'field_option')},
        ),
    ]
