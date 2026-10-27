from rest_framework import serializers
from rest_framework_gis.fields import GeometryField
from .models import Donor, DonorLocation, Donation, Notification

class DonorSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Donor
        fields = [
            "id", "email", "first_name", "middle_names", "last_name", "full_name", "blood_type", "phone",
            "is_verified", "last_donation_date",
            "date_of_birth", "gender", "weight_kg", "height_cm", "national_id",
        ]
        read_only_fields = ["id", "is_verified", "last_donation_date"]

    def validate_blood_type(self, value):
        instance = self.instance
        if instance and instance.blood_type and value != instance.blood_type:
            raise serializers.ValidationError(
                "Blood type cannot be changed once set. Contact a hospital staff "
                "member or KNBTS admin to update it."
            )
        return value

class DonorSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Donor
        fields = [
            "id", "full_name", "blood_type", "gender",
            "national_id", "last_donation_date",
        ]
        read_only_fields = fields 
        
class DonorLocationSerializer(serializers.ModelSerializer):
    point = GeometryField()

    class Meta:
        model = DonorLocation
        fields = ["id", "label", "point", "location_type", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        donor = self.context["request"].user.donor_profile
        location_type = data.get("location_type", getattr(self.instance, "location_type", None))

        existing = donor.locations.filter(location_type=location_type)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)

        if location_type == DonorLocation.LocationType.FREQUENT:
            limit = DonorLocation.MAX_FREQUENT
        else:
            limit = DonorLocation.MAX_LIVE

        if existing.count() >= limit:
            raise serializers.ValidationError(
                f"You already have the maximum of {limit} '{location_type}' location(s)."
            )
        return data

class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source="donor.full_name", read_only=True)
    regional_storage_center_name = serializers.CharField(
        source="regional_storage_center.region_name", read_only=True
    )

    class Meta:
        model = Donation
        fields = [
            "id", "donor", "donor_name", "regional_storage_center",
            "regional_storage_center_name", "blood_type", "units_donated",
            "donation_date",
        ]
        read_only_fields = ["id", "donation_date"]


class NotificationSerializer(serializers.ModelSerializer):
    blood_type = serializers.CharField(
        source="blood_request.blood_type", read_only=True, default=None
    )
    units_needed = serializers.IntegerField(
        source="blood_request.units_needed", read_only=True, default=None
    )
    urgency_level = serializers.CharField(
        source="blood_request.urgency_level", read_only=True, default=None
    )
    request_status = serializers.CharField(
        source="blood_request.status", read_only=True, default=None
    )
    regional_storage_center_name = serializers.CharField(
        source="blood_request.regional_storage_center.region_name",
        read_only=True,
        default=None,
    )

    class Meta:
        model = Notification
        fields = [
            "id", "donor", "blood_request", "date", "status", "message_type",
            "blood_type", "units_needed", "urgency_level", "request_status",
            "regional_storage_center_name",
        ]
        read_only_fields = ["id", "donor", "blood_request", "date", "message_type"]

    def validate_status(self, value):
        if value not in (Notification.Status.ACCEPTED, Notification.Status.DECLINED):
            raise serializers.ValidationError("You can only accept or decline an alert.")

        notification = self.instance
        if notification is None:
            return value

        if notification.status != Notification.Status.PENDING:
            raise serializers.ValidationError(
                "This alert has already been answered or has expired."
            )

        blood_request = notification.blood_request
        if blood_request and blood_request.status != blood_request.Status.PENDING:
            raise serializers.ValidationError("This request is no longer open.")

        if value == Notification.Status.ACCEPTED:
            issues = notification.donor.eligibility_issues()
            if issues:
                raise serializers.ValidationError(
                    ["You cannot accept this alert right now."] + issues
                )

        return value
    
class RequestResponseSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source="donor.full_name", read_only=True)
    blood_type = serializers.CharField(source="donor.blood_type", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "donor_name", "blood_type", "status"]
        read_only_fields = fields