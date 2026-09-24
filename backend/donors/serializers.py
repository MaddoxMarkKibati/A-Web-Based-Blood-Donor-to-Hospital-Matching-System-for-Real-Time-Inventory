from rest_framework import serializers
from rest_framework_gis.fields import GeometryField
from .models import Donor

class DonorSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    location = GeometryField(required=False, allow_null=True)

    class Meta:
        model = Donor
        fields = [
            "id", "email", "name", "blood_type", "phone",
            "location", "is_verified", "last_donation_date",
        ]
        read_only_fields = ["id", "is_verified", "last_donation_date"]