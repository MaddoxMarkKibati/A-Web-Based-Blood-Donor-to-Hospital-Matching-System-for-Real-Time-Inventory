from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from .models import Hospital, RegionalStorageCenter, BloodInventory, BloodRequest, ReserveThreshold


class HospitalSerializer(serializers.ModelSerializer):
    location = GeometryField(required=False, allow_null=True)

    class Meta:
        model = Hospital
        fields = ["id", "name", "address", "contact_info", "location"]


class MyHospitalSerializer(serializers.ModelSerializer):
    """What hospital staff see and may change for their own hospital: only the location."""

    location = GeometryField(required=False, allow_null=True)

    class Meta:
        model = Hospital
        fields = ["id", "name", "address", "contact_info", "location"]
        read_only_fields = ["id", "name", "address", "contact_info"]


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
    alerted_count = serializers.IntegerField(read_only=True, default=0)
    accepted_count = serializers.IntegerField(read_only=True, default=0)
    class Meta:
        model = BloodRequest
        fields = [
            "id", "regional_storage_center", "regional_storage_center_name",
            "staff", "staff_name", "blood_type", "units_needed",
            "urgency_level", "status", "created_at", "alerted_count", "accepted_count",
        ]
        read_only_fields = ["id", "staff", "created_at"]
        
    def validate_units_needed(self, value):
        if value < 1:
            raise serializers.ValidationError("Request at least 1 unit.")
        return value

    def validate(self, attrs):
        if self.instance is None:
            # A new request always starts as pending.
            attrs["status"] = BloodRequest.Status.PENDING
            return attrs

        if not attrs:
            return attrs
        if set(attrs) != {"status"}:
            raise serializers.ValidationError("Only the status of a request can be changed.")
        if self.instance.status != BloodRequest.Status.PENDING:
            raise serializers.ValidationError(
                f"This request is already {self.instance.status} and cannot be changed."
            )
        if attrs["status"] not in (
            BloodRequest.Status.FULFILLED,
            BloodRequest.Status.CANCELLED,
        ):
            raise serializers.ValidationError("A request can only be marked fulfilled or cancelled.")
        return attrs

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
        
class RecordHospitalDonationSerializer(serializers.Serializer):
    blood_request = serializers.IntegerField()
    donor = serializers.IntegerField()