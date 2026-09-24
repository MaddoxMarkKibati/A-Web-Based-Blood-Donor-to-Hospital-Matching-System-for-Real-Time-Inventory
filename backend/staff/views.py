from rest_framework import generics, permissions

from accounts.permissions import IsHospitalStaffOrKNBTSAdmin
from .models import Staff
from .serializers import StaffSerializer


class MyStaffProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaffOrKNBTSAdmin]

    def get_object(self):
        return self.request.user.staff_profile