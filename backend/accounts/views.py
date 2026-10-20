from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import generics, permissions

from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def perform_create(self, serializer):
        user = serializer.save()
        names = {
            "first_name": serializer.validated_data.get("first_name", ""),
            "middle_names": serializer.validated_data.get("middle_names", ""),
            "last_name": serializer.validated_data.get("last_name", ""),
        }

        if user.role == User.Role.DONOR:
            from donors.models import Donor
            Donor.objects.create(user=user, **names)

        elif user.role == User.Role.HOSPITAL_STAFF:
            from staff.models import Staff
            Staff.objects.create(user=user, role="Staff", **names)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user