from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from django.utils.translation import gettext_lazy as _

class CustomUserAdmin(UserAdmin):
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "email")}),
        (_("Permissions"), {
            "fields": (
                "is_active", "is_staff", "is_superuser", "groups", "user_permissions"
            )
        }),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
        (_("Role Info"), {"fields": ("role",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username", "email", "password1", "password2",
                "first_name", "last_name", "role"
            ),
        }),
    )
    list_display = ("id", "username", "email", "role", "is_staff", "is_superuser")
    search_fields = ("username", "email", "role")
    ordering = ("username",)

admin.site.register(CustomUser, CustomUserAdmin)
