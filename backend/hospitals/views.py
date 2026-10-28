from django.db import transaction
from django.utils import timezone
from django.db.models import Case, IntegerField, Value, When
from rest_framework import filters, generics, permissions
from rest_framework.generics import get_object_or_404
from .alerts import expire_stale_alerts, top_up_alerts
import logging
logger = logging.getLogger(__name__)

from accounts.permissions import (
    IsHospitalStaff,
    IsHospitalStaffOrKNBTSAdmin,
    IsKNBTSAdmin,
)
from donors.models import Donor, Notification
from donors.serializers import (
    DonationSerializer,
    DonorSerializer,
    DonorSummarySerializer,
    RequestResponseSerializer,
)

from .models import BloodInventory, BloodRequest, Hospital, RegionalStorageCenter
from .serializers import (
    BloodInventorySerializer,
    BloodRequestSerializer,
    HospitalSerializer,
    RegionalStorageCenterSerializer,
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
        blood_request = serializer.save(staff=self.request.user.staff_profile)
        try:
            top_up_alerts(blood_request.pk)
        except Exception:
            logger.exception("Alert top-up failed for request %s", blood_request.pk)


class BloodRequestDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaff]

    def get_queryset(self):
        return BloodRequest.objects.filter(staff=self.request.user.staff_profile)


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


class DonorBloodTypeOverrideView(generics.UpdateAPIView):
    """Lets hospital staff or KNBTS admins correct a donor's blood_type,
    bypassing the self-service lock in DonorSerializer."""

    queryset = Donor.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaffOrKNBTSAdmin]

    class _OverrideSerializer(DonorSerializer):
        def validate_blood_type(self, value):
            # Staff and admins may correct blood_type at any time.
            return value

    serializer_class = _OverrideSerializer


class DonorSearchView(generics.ListAPIView):
    """Staff/admin search for donors by name or national ID."""

    serializer_class = DonorSummarySerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaffOrKNBTSAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ["first_name", "middle_names", "last_name", "national_id"]

    def get_queryset(self):
        term = self.request.query_params.get("search", "").strip()
        if len(term) < 2:
            return Donor.objects.none()
        return Donor.objects.all()

    def filter_queryset(self, queryset):
        return super().filter_queryset(queryset)[:20]
    
class RequestResponsesView(generics.ListAPIView):
    """Donors alerted for one of the logged-in staff member's blood requests,
    with their response status."""

    serializer_class = RequestResponseSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaff]

    def get_queryset(self):
        blood_request = get_object_or_404(
            BloodRequest,
            pk=self.kwargs["pk"],
            staff=self.request.user.staff_profile,
        )
        
        try:
            expire_stale_alerts(blood_request.pk)
        except Exception:
            logger.exception("Alert expiry failed for request %s", blood_request.pk)
            
        status_order = Case(
            When(status=Notification.Status.ACCEPTED, then=Value(0)),
            When(status=Notification.Status.PENDING, then=Value(1)),
            When(status=Notification.Status.DECLINED, then=Value(2)),
            default=Value(3),
            output_field=IntegerField(),
        )
        return (
            Notification.objects.filter(blood_request=blood_request)
            .select_related("donor")
            .annotate(status_order=status_order)
            .order_by("status_order", "-date")
        )