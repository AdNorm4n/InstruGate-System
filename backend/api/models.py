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

class Quotation(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quotations')
    submitted_at = models.DateTimeField(auto_now_add=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    project_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks = models.TextField(blank=True, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    rejected_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Quotation {self.id} by {self.created_by.username} ({self.status})"

class QuotationItem(models.Model):
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    product_code = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=1)
    instrument = models.ForeignKey(Instrument, on_delete=models.CASCADE)

    def __str__(self):
        return f"(Quotation {self.quotation.id})"

class QuotationItemSelection(models.Model):
    quotation_item = models.ForeignKey(QuotationItem, on_delete=models.CASCADE, related_name='selections')
    field_option = models.ForeignKey(FieldOption, on_delete=models.CASCADE)

    def __str__(self):
        return f"Selection {self.field_option} for QuotationItem {self.quotation_item.id}"

class QuotationItemAddOn(models.Model):
    quotation_item = models.ForeignKey(QuotationItem, on_delete=models.CASCADE, related_name='addons')
    addon = models.ForeignKey(AddOn, on_delete=models.CASCADE)

    def __str__(self):
        return f"AddOn {self.addon} for QuotationItem {self.quotation_item.id}"