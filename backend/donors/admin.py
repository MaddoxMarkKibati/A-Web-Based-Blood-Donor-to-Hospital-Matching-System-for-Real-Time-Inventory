from django.contrib import admin

from .models import Donor, Donation, Notification


@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ("name", "blood_type", "phone", "is_verified", "last_donation_date")
    list_filter = ("blood_type", "is_verified")
    search_fields = ("name", "phone")


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ("donor", "regional_storage_center", "blood_type", "units_donated", "donation_date")
    list_filter = ("blood_type", "regional_storage_center")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("donor", "status", "message_type", "date")
    list_filter = ("status",)