from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from .models import Hospital, RegionalStorageCenter, BloodInventory, BloodRequest


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = ["id", "name", "address", "contact_info"]


class RegionalStorageCenterSerializer(serializers.ModelSerializer):
    location = GeometryField(required=False, allow_null=True)

    class Meta:
        model = RegionalStorageCenter
        fields = ["id", "region_name", "county", "location"]


class BloodInventorySerializer(serializers.ModelSerializer):
    regional_storage_center_name = serializers.CharField(
        source="regional_storage_center.region_name", read_only=True
    )

    class Meta:
        model = BloodInventory
        fields = [
            "id", "regional_storage_center", "regional_storage_center_name",
            "blood_type", "units_available", "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]


class BloodRequestSerializer(serializers.ModelSerializer):
    regional_storage_center_name = serializers.CharField(
        source="regional_storage_center.region_name", read_only=True
    )
    staff_name = serializers.CharField(source="staff.name", read_only=True, default=None)

    class Meta:
        model = BloodRequest
        fields = [
            "id", "regional_storage_center", "regional_storage_center_name",
            "staff", "staff_name", "blood_type", "units_needed",
            "urgency_level", "status", "created_at",
        ]
        read_only_fields = ["id", "staff", "created_at"]