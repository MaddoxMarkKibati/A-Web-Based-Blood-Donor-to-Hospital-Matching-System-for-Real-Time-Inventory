from rest_framework import serializers

from .models import Staff


class StaffSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    hospital_name = serializers.CharField(source="hospital.name", read_only=True, default=None)
    regional_storage_center_name = serializers.CharField(
        source="regional_storage_center.region_name", read_only=True, default=None
    )

    class Meta:
        model = Staff
        fields = [
            "id", "email", "name", "role",
            "hospital", "hospital_name",
            "regional_storage_center", "regional_storage_center_name",
        ]
        read_only_fields = ["id", "hospital", "regional_storage_center"]