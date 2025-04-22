from django.contrib import admin
from .models import Category, InstrumentType, Instrument, ConfigurableField, FieldOption, AddOn


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

@admin.register(AddOn)
class AddOnAdmin(admin.ModelAdmin):
    list_display = ["label", "code", "instrument"]
    list_filter = ["instrument"]
    search_fields = ["label", "code"]
