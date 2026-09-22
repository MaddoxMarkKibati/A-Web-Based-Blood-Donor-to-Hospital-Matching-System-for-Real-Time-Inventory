from django.contrib import admin

from .models import Hospital, RegionalStorageCenter, BloodInventory, BloodRequest


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ("name", "address", "contact_info")
    search_fields = ("name",)


@admin.register(RegionalStorageCenter)
class RegionalStorageCenterAdmin(admin.ModelAdmin):
    list_display = ("region_name", "county")
    search_fields = ("region_name", "county")


@admin.register(BloodInventory)
class BloodInventoryAdmin(admin.ModelAdmin):
    list_display = ("regional_storage_center", "blood_type", "units_available", "updated_at")
    list_filter = ("blood_type", "regional_storage_center")


@admin.register(BloodRequest)
class BloodRequestAdmin(admin.ModelAdmin):
    list_display = ("regional_storage_center", "blood_type", "units_needed", "urgency_level", "status", "created_at")
    list_filter = ("status", "urgency_level", "blood_type")