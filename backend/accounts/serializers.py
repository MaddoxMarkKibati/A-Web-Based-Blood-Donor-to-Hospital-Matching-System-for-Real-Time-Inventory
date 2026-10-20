from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

NAME_FIELDS = ("first_name", "middle_names", "last_name")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "role", "is_active", "date_joined"]
        read_only_fields = ["id", "is_active", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(write_only=True, max_length=100)
    middle_names = serializers.CharField(
        write_only=True, max_length=150, required=False, allow_blank=True
    )
    last_name = serializers.CharField(write_only=True, max_length=100)

    class Meta:
        model = User
        fields = [
            "id", "email", "password", "role",
            "first_name", "middle_names", "last_name",
        ]
        read_only_fields = ["id"]

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError(
                "KNBTS Admin accounts cannot self-register."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        for key in NAME_FIELDS:
            validated_data.pop(key, None)
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
