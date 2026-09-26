from rest_framework import generics, permissions

from accounts.permissions import IsHospitalStaff, IsHospitalStaffOrKNBTSAdmin, IsKNBTSAdmin
from .models import Hospital, RegionalStorageCenter, BloodInventory, BloodRequest
from .serializers import (
    HospitalSerializer,
    RegionalStorageCenterSerializer,
    BloodInventorySerializer,
    BloodRequestSerializer,
)


class HospitalListView(generics.ListAPIView):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = [permissions.IsAuthenticated]


class RegionalStorageCenterListView(generics.ListAPIView):
    queryset = RegionalStorageCenter.objects.all()
    serializer_class = RegionalStorageCenterSerializer
    permission_classes = [permissions.IsAuthenticated]


class BloodInventoryListView(generics.ListAPIView):
    serializer_class = BloodInventorySerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaffOrKNBTSAdmin]

    def get_queryset(self):
        qs = BloodInventory.objects.select_related("regional_storage_center")
        rsc_id = self.request.query_params.get("regional_storage_center")
        if rsc_id:
            qs = qs.filter(regional_storage_center_id=rsc_id)
        return qs


class BloodInventoryUpdateView(generics.RetrieveUpdateAPIView):
    queryset = BloodInventory.objects.all()
    serializer_class = BloodInventorySerializer
    permission_classes = [permissions.IsAuthenticated, IsKNBTSAdmin]


class BloodRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaff]

    def get_queryset(self):
        return BloodRequest.objects.filter(staff=self.request.user.staff_profile)

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user.staff_profile)


class BloodRequestDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaff]

    def get_queryset(self):
        return BloodRequest.objects.filter(staff=self.request.user.staff_profile)