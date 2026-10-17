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
    
from django.db import transaction
from django.utils import timezone

from accounts.permissions import IsKNBTSAdmin
from donors.models import Donation
from donors.serializers import DonationSerializer


class RecordDonationView(generics.CreateAPIView):
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated, IsKNBTSAdmin]

    @transaction.atomic
    def perform_create(self, serializer):
        donation = serializer.save()

        donor = donation.donor
        donor.last_donation_date = timezone.now()
        donor.save(update_fields=["last_donation_date"])

        inventory, _ = BloodInventory.objects.get_or_create(
            regional_storage_center=donation.regional_storage_center,
            blood_type=donation.blood_type,
            defaults={"units_available": 0},
        )
        inventory.units_available += donation.units_donated
        inventory.save(update_fields=["units_available", "updated_at"])
        
from accounts.permissions import IsHospitalStaffOrKNBTSAdmin
from donors.models import Donor
from donors.serializers import DonorSerializer


class DonorBloodTypeOverrideView(generics.UpdateAPIView):
    """Lets hospital staff or KNBTS admins correct a donor's blood_type,
    bypassing the self-service lock in DonorSerializer."""

    queryset = Donor.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaffOrKNBTSAdmin]

    class _OverrideSerializer(DonorSerializer):
        def validate_blood_type(self, value):
            # Skip the lock entirely for this endpoint; staff/admin are
            # explicitly allowed to correct blood_type at any time.
            return value

    serializer_class = _OverrideSerializer    