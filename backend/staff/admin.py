from django.contrib import admin

from .models import Staff


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "hospital", "regional_storage_center")
    list_filter = ("role", "hospital")
    search_fields = ("name",)