from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from .models import Hospital, RegionalStorageCenter, BloodInventory, BloodRequest, ReserveThreshold


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
    staff_name = serializers.CharField(source="staff.full_name", read_only=True, default=None)

    class Meta:
        model = BloodRequest
        fields = [
            "id", "regional_storage_center", "regional_storage_center_name",
            "staff", "staff_name", "blood_type", "units_needed",
            "urgency_level", "status", "created_at",
        ]
        read_only_fields = ["id", "staff", "created_at"]

class ReserveThresholdSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReserveThreshold
        fields = ["id", "blood_type", "minimum_units", "updated_at"]
        read_only_fields = ["id", "blood_type", "updated_at"]

class RequestMonitorSerializer(serializers.ModelSerializer):
    regional_storage_center_name = serializers.CharField(
        source="regional_storage_center.region_name", read_only=True
    )
    staff_name = serializers.CharField(source="staff.full_name", read_only=True, default=None)
    alerted = serializers.IntegerField(source="alerted_count", read_only=True)
    accepted = serializers.IntegerField(source="accepted_count", read_only=True)
    pending = serializers.IntegerField(source="pending_count", read_only=True)
    declined = serializers.IntegerField(source="declined_count", read_only=True)
    expired = serializers.IntegerField(source="expired_count", read_only=True)

    class Meta:
        model = BloodRequest
        fields = [
            "id", "regional_storage_center_name", "staff_name", "blood_type",
            "units_needed", "urgency_level", "status", "created_at",
            "alerted", "accepted", "pending", "declined", "expired",
        ]
        read_only_fields = fields