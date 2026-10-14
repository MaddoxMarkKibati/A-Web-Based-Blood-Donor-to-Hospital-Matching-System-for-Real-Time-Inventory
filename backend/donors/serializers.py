from rest_framework import serializers
from rest_framework_gis.fields import GeometryField
from .models import Donor, Donation, Notification

class DonorSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Donor
        fields = [
            "id", "email", "name", "blood_type", "phone",
            "location", "is_verified", "last_donation_date",
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
        
class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source="donor.name", read_only=True)
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
    class Meta:
        model = Notification
        fields = ["id", "donor", "blood_request", "date", "status", "message_type"]
        read_only_fields = ["id", "donor", "blood_request", "date", "message_type"]