from django.contrib import admin
from django.utils import timezone
from .models import (
    Category, InstrumentType, Instrument,
    ConfigurableField, FieldOption,
    AddOn, AddOnType, Quotation, QuotationItem,
    QuotationItemSelection, QuotationItemAddOn
)
from django.utils.translation import gettext_lazy as _

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name"]
    list_display_links = ["name"]  # Make name clickable
    list_per_page = 25  # Optimize pagination for Render

    def save_model(self, request, obj, form, change):
        obj.save()
        self.log_change(request, obj, f"{'Updated' if change else 'Created'} category: {obj.name}")

@admin.register(InstrumentType)
class InstrumentTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "category"]
    list_display_links = ["name"]  # Make name clickable
    list_per_page = 25

    def save_model(self, request, obj, form, change):
        obj.save()
        self.log_change(request, obj, f"{'Updated' if change else 'Created'} instrument type: {obj.name}")

class FieldOptionInline(admin.TabularInline):
    model = FieldOption
    extra = 1
    fields = ["label", "code", "price"]

class ConfigurableFieldInline(admin.StackedInline):
    model = ConfigurableField
    extra = 1
    show_change_link = True
    fields = ["name", "order", "parent_field", "trigger_value"]
    ordering = ["order"]

@admin.register(ConfigurableField)
class ConfigurableFieldAdmin(admin.ModelAdmin):
    list_display = ["name", "instrument", "order", "parent_field", "trigger_value"]
    list_display_links = ["name"]  # Make name clickable
    ordering = ["instrument", "order"]
    inlines = [FieldOptionInline]
    list_per_page = 25

    def save_model(self, request, obj, form, change):
        obj.save()
        self.log_change(request, obj, f"{'Updated' if change else 'Created'} configurable field: {obj.name}")

@admin.register(Instrument)
class InstrumentAdmin(admin.ModelAdmin):
    list_display = ["name", "type", "is_available", "base_price", "created_at"]
    list_display_links = ["name"]  # Make name clickable
    list_filter = ["type", "type__category", "is_available"]
    search_fields = ["name", "type__name", "specifications"]
    readonly_fields = ["created_at"]
    inlines = [ConfigurableFieldInline]
    list_per_page = 25

    fieldsets = (
        ("Basic Info", {
            "fields": ("name", "type", "base_price", "is_available")
        }),
        ("Instrument Description", {
            "fields": ("description", "specifications")
        }),
        ("Media & Meta", {
            "fields": ("image", "created_at"),
            "classes": ("collapse",),
        }),
    )

    def save_model(self, request, obj, form, change):
        obj.save()
        self.log_change(request, obj, f"{'Updated' if change else 'Created'} instrument: {obj.name}")

class AddOnInline(admin.TabularInline):
    model = AddOn
    extra = 1
    fields = ["label", "code"]

@admin.register(AddOnType)
class AddOnTypeAdmin(admin.ModelAdmin):
    list_display = ["name"]
    list_display_links = ["name"]  # Make name clickable
    search_fields = ["name"]
    filter_horizontal = ["instruments"]
    inlines = [AddOnInline]
    list_per_page = 25

    def save_model(self, request, obj, form, change):
        obj.save()
        self.log_change(request, obj, f"{'Updated' if change else 'Created'} add-on type: {obj.name}")

@admin.register(AddOn)
class AddOnAdmin(admin.ModelAdmin):
    list_display = ["label", "code", "addon_type", "price"]
    list_display_links = ["label"]  # Make label clickable
    list_filter = ["addon_type"]
    search_fields = ["label", "code"]
    list_per_page = 25

    def save_model(self, request, obj, form, change):
        obj.save()
        self.log_change(request, obj, f"{'Updated' if change else 'Created'} add-on: {obj.label}")

class QuotationItemSelectionInline(admin.TabularInline):
    model = QuotationItemSelection
    extra = 0
    fields = ['field_option']
    readonly_fields = ['field_option']

class QuotationItemAddOnInline(admin.TabularInline):
    model = QuotationItemAddOn
    extra = 0
    fields = ['addon']
    readonly_fields = ['addon']

class QuotationItemInline(admin.TabularInline):
    model = QuotationItem
    extra = 0
    fields = ['product_code', 'quantity', 'instrument', 'total_price_display']
    readonly_fields = ['product_code', 'quantity', 'instrument', 'total_price_display']
    inlines = [QuotationItemSelectionInline, QuotationItemAddOnInline]

    def total_price_display(self, obj):
        return f"RM {obj.calculate_total_price():,.2f}"
    total_price_display.short_description = "Total Price (RM)"

@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'created_by', 'company', 'project_name', 'status',
        'submitted_at', 'rejected_at', 'approved_at', 'reviewed_by', 'emailed_at', 'updated_at',
        'total_quotation_price'
    ]
    list_display_links = ['id', 'company']  # Make id and company clickable
    list_filter = ['status', 'created_by__role', 'reviewed_by']
    search_fields = ['id', 'company', 'created_by__username', 'reviewed_by__username']
    inlines = [QuotationItemInline]
    list_per_page = 25

    fieldsets = (
        (None, {'fields': ('created_by', 'company', 'project_name')}),
        (_('Review'), {'fields': ('status', 'remarks', 'reviewed_by')}),
        (_('Timestamps'), {'fields': ('submitted_at', 'approved_at', 'rejected_at', 'emailed_at')}),
        (_('Summary'), {'fields': ('total_quotation_price',)}),
    )

    readonly_fields = [
        'submitted_at', 'rejected_at', 'approved_at', 'reviewed_by', 'emailed_at', 'updated_at',
        'total_quotation_price'
    ]

    actions = ['submit_quotation', 'approve_quotation', 'reject_quotation']

    def has_view_or_change_permission(self, request, obj=None):
        return request.user.is_authenticated and request.user.role in ['proposal_engineer', 'admin']

    def submit_quotation(self, request, queryset):
        queryset.update(status='submitted', emailed_at=timezone.now())
        self.message_user(request, "Quotations have been marked as submitted.")
    submit_quotation.short_description = "Mark quotations as submitted"

    def approve_quotation(self, request, queryset):
        queryset.update(status='approved', remarks='', approved_at=timezone.now(), reviewed_by=request.user)
        self.message_user(request, "Quotations have been approved.")
    approve_quotation.short_description = "Approve quotations"

    def reject_quotation(self, request, queryset):
        remarks = request.POST.get('remarks', '') if request.POST else ''
        if not remarks:
            self.message_user(request, "Please provide remarks for rejection.", level='error')
            return
        queryset.update(status='rejected', remarks=remarks, rejected_at=timezone.now(), reviewed_by=request.user)
        self.message_user(request, "Quotations have been rejected with remarks.")
    reject_quotation.short_description = "Reject quotations with remarks"

    def total_quotation_price(self, obj):
        return f"RM {obj.calculate_total_price():,.2f}"
    total_quotation_price.short_description = "Total Quotation Price (RM)"

    def save_model(self, request, obj, form, change):
        obj.save()
        self.log_change(request, obj, f"{'Updated' if change else 'Created'} quotation: {obj.id}")

@admin.register(QuotationItem)
class QuotationItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'quotation', 'product_code', 'instrument', 'quantity', 'total_price_display']
    list_display_links = ['id', 'product_code']  # Make id and product_code clickable
    readonly_fields = ['quotation', 'product_code', 'instrument', 'quantity', 'total_price_display', 'field_options_list', 'addons_list']
    list_per_page = 25

    fieldsets = (
        (None, {
            'fields': ('quotation', 'product_code', 'instrument', 'quantity', 'total_price_display')
        }),
        ('Selected Field Options', {
            'fields': ('field_options_list',),
        }),
        ('Selected Add-Ons', {
            'fields': ('addons_list',),
        }),
    )

    def total_price_display(self, obj):
        return f"RM {obj.calculate_total_price():,.2f}"
    total_price_display.short_description = "Total Price (RM)"

    def field_options_list(self, obj):
        if not obj.selections.exists():
            return "-"
        return "\n".join([f"{sel.field_option.label} (RM {sel.field_option.price})" for sel in obj.selections.all()])
    field_options_list.short_description = "Field Options"

    def addons_list(self, obj):
        if not obj.addons.exists():
            return "-"
        return "\n".join([f"{addon.addon.label} (RM {addon.addon.price})" for addon in obj.addons.all()])
    addons_list.short_description = "Add-Ons"

    def save_model(self, request, obj, form, change):
        obj.save()
        self.log_change(request, obj, f"{'Updated' if change else 'Created'} quotation item: {obj.id}")