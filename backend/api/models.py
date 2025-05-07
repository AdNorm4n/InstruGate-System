from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Category(models.Model):
    CATEGORY_CHOICES = [
        ('Pressure Instruments', 'Pressure Instruments'),
        ('Temperature Instruments', 'Temperature Instruments'),
        ('Test Instruments', 'Test Instruments'),
    ]
    name = models.CharField(max_length=100, choices=CATEGORY_CHOICES, unique=True)

    def __str__(self):
        return self.name

class InstrumentType(models.Model):
    TYPE_CHOICES = [
        ('Pressure Gauges', 'Pressure Gauges'),
        ('Digital Gauges', 'Digital Gauges'),
        ('High-Purity', 'High-Purity'),
        ('Test Gauges', 'Test Gauges'),
        ('Differential Gauges', 'Differential Gauges'),
        ('Pressure Switches', 'Pressure Switches'),
        ('Pressure Sensors', 'Pressure Sensors'),
        ('Diaphragm Seals - Isolators', 'Diaphragm Seals - Isolators'),
        ('Threaded Seals', 'Threaded Seals'),
        ('Isolation Rings', 'Isolation Rings'),
        ('Flanged Seals', 'Flanged Seals'),
        ('In-Line', 'In-Line'),
        ('Accessories', 'Accessories'),
        ('Thermometers', 'Thermometers'),
        ('Bimetals Thermometers', 'Bimetals Thermometers'),
        ('Gas Actuated Thermometers', 'Gas Actuated Thermometers'),
        ('Thermowells', 'Thermowells'),
        ('Test Gauges', 'Test Gauges'),
    ]
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='types')
    name = models.CharField(max_length=100, choices=TYPE_CHOICES)

    def __str__(self):
        return f"{self.name} ({self.category.name})"

class Instrument(models.Model):
    type = models.ForeignKey(InstrumentType, on_delete=models.CASCADE, related_name='instruments')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    specifications = models.TextField(blank=True)
    image = models.ImageField(upload_to='instruments/', blank=True, null=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ConfigurableField(models.Model):
    instrument = models.ForeignKey(Instrument, on_delete=models.CASCADE, related_name="fields")
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    parent_field = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="dependent_fields")
    trigger_value = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.instrument.name} - {self.name}"

class FieldOption(models.Model):
    field = models.ForeignKey(ConfigurableField, on_delete=models.CASCADE, related_name="options")
    label = models.CharField(max_length=200)
    code = models.CharField(max_length=20)

    def __str__(self):
        return f"[{self.code}] {self.label}"

class AddOnType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    instruments = models.ManyToManyField(Instrument, related_name="addon_types")

    def __str__(self):
        return self.name

class AddOn(models.Model):
    addon_type = models.ForeignKey(AddOnType, on_delete=models.CASCADE, related_name="addons")
    label = models.CharField(max_length=200)
    code = models.CharField(max_length=20)

    def __str__(self):
        return f"[{self.code}] {self.label} ({self.addon_type.name})"

# NEW MODELS FOR QUOTATION & CONFIGURATION

class SubmittedConfiguration(models.Model):
    instrument = models.ForeignKey(Instrument, on_delete=models.CASCADE)
    selected_fields = models.JSONField()
    selected_addons = models.JSONField(blank=True, null=True)
    product_code = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.instrument.name} - {self.product_code}"

class Quotation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=50, choices=[('draft', 'Draft'), ('submitted', 'Submitted')], default='draft')
    configurations = models.ManyToManyField(SubmittedConfiguration, related_name='quotations')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quotation #{self.id} - {self.status}"
