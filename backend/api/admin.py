from django.contrib import admin
from .models import (
    Category, InstrumentType, Instrument,
    ConfigurableField, FieldOption,
    AddOn, AddOnType,
    Quotation, SubmittedConfiguration,
)

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
    readonly_fields = ("created_at",)
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

@admin.register(SubmittedConfiguration)
class SubmittedConfigurationAdmin(admin.ModelAdmin):
    list_display = ['instrument', 'product_code', 'created_at']
    readonly_fields = ['created_at']

@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'username', 'status', 'created_at', 'configuration_count']
    readonly_fields = ['created_at']
    list_filter = ['status', 'user']
    search_fields = ['user__username', 'remarks']

    def username(self, obj):
        return obj.user.username
    username.short_description = 'Username'

    def configuration_count(self, obj):
        return obj.configurations.count()
    configuration_count.short_description = 'Configurations'