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

        if user.role == User.Role.DONOR:
            from donors.models import Donor
            Donor.objects.create(user=user, name=user.email.split("@")[0])

        elif user.role == User.Role.HOSPITAL_STAFF:
            from staff.models import Staff
            Staff.objects.create(user=user, name=user.email.split("@")[0], role="Staff")


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user