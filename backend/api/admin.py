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

@admin.register(InstrumentType)
class InstrumentTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "category"]

class FieldOptionInline(admin.TabularInline):
    model = FieldOption
    extra = 1

class ConfigurableFieldInline(admin.StackedInline):
    model = ConfigurableField
    extra = 1
    show_change_link = True
    fields = ["name", "order", "parent_field", "trigger_value"]
    ordering = ["order"]

@admin.register(ConfigurableField)
class ConfigurableFieldAdmin(admin.ModelAdmin):
    list_display = ["name", "instrument", "order", "parent_field", "trigger_value"]
    ordering = ["instrument", "order"]
    inlines = [FieldOptionInline]

@admin.register(Instrument)
class InstrumentAdmin(admin.ModelAdmin):
    list_display = ["name", "type", "is_available", "created_at"]
    list_filter = ["type", "type__category", "is_available"]
    search_fields = ["name", "type__name", "specifications"]
    readonly_fields = ["created_at"]
    inlines = [ConfigurableFieldInline]

    fieldsets = (
        ("Basic Info", {
            "fields": ("name", "type", "is_available")
        }),
        ("Instrument Description", {
            "fields": ("description", "specifications")
        }),
        ("Media & Meta", {
            "fields": ("image", "created_at"),
            "classes": ("collapse",),
        }),
    )

class AddOnInline(admin.TabularInline):
    model = AddOn
    extra = 1
    fields = ["label", "code"]

@admin.register(AddOnType)
class AddOnTypeAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]
    filter_horizontal = ["instruments"]
    inlines = [AddOnInline]

@admin.register(AddOn)
class AddOnAdmin(admin.ModelAdmin):
    list_display = ["label", "code", "addon_type"]
    list_filter = ["addon_type"]
    search_fields = ["label", "code"]

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
    fields = ['product_code', 'quantity', 'instrument']
    readonly_fields = ['product_code', 'quantity', 'instrument']
    inlines = [QuotationItemSelectionInline, QuotationItemAddOnInline]

@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ['id', 'created_by', 'company', 'project_name', 'status', 'submitted_at', 'rejected_at', 'approved_at', 'updated_at']
    list_filter = ['status', 'created_by__role']
    search_fields = ['id', 'company', 'created_by__username']
    inlines = [QuotationItemInline]
    fieldsets = (
        (None, {'fields': ('created_by', 'company', 'project_name')}),
        (_('Review'), {'fields': ('status', 'remarks')}),
    )
    readonly_fields = ['submitted_at', 'rejected_at', 'approved_at', 'updated_at']
    actions = ['approve_quotation', 'reject_quotation']

    def has_view_or_change_permission(self, request, obj=None):
        return request.user.is_authenticated and request.user.role in ['proposal_engineer', 'admin']

    def approve_quotation(self, request, queryset):
        queryset.update(status='approved', remarks='', approved_at=timezone.now())
        self.message_user(request, "Quotations have been approved.")
    approve_quotation.short_description = "Approve quotations"

    def reject_quotation(self, request, queryset):
        remarks = request.POST.get('remarks', '') if request.POST else ''
        if not remarks:
            self.message_user(request, "Please provide remarks for rejection.", level='error')
            return
        queryset.update(status='rejected', remarks=remarks, rejected_at=timezone.now())
        self.message_user(request, "Quotations have been rejected with remarks.")
    reject_quotation.short_description = "Reject quotations with remarks"