from django.db import transaction
from django.utils import timezone
from django.db.models import Case, Count, IntegerField, Q, Value, When, Sum
from django.contrib.gis.db.models.functions import Distance
from rest_framework import filters, generics, permissions, status as http_status
from rest_framework.generics import get_object_or_404
from rest_framework.exceptions import NotFound
from .alerts import expire_stale_alerts, top_up_alerts
from rest_framework.response import Response
from rest_framework.views import APIView
import logging
logger = logging.getLogger(__name__)

from accounts.permissions import (
    IsHospitalStaff,
    IsHospitalStaffOrKNBTSAdmin,
    IsKNBTSAdmin,
)
from donors.models import Donation, Donor, DonorLocation, Notification
from donors.serializers import (
    DonationSerializer,
    DonorSerializer,
    DonorSummarySerializer,
    RequestResponseSerializer,
)

from .models import BloodInventory, BloodRequest, Hospital, RegionalStorageCenter, ReserveThreshold, HospitalInventory
from .serializers import (
    BloodInventorySerializer,
    BloodRequestSerializer,
    HospitalSerializer,
    RegionalStorageCenterSerializer,
    ReserveThresholdSerializer,
    RequestMonitorSerializer,    
    MyHospitalSerializer,
    RecordHospitalDonationSerializer,
    HospitalInventorySerializer,
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


def with_response_counts(queryset):
    """Adds how many donors were alerted and how many accepted to each request."""
    return queryset.annotate(
        alerted_count=Count("notifications"),
        accepted_count=Count(
            "notifications",
            filter=Q(notifications__status=Notification.Status.ACCEPTED),
        ),
    )
class BloodRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaff]

    def get_queryset(self):
        return with_response_counts(
            BloodRequest.objects.filter(staff=self.request.user.staff_profile)
        )

    def perform_create(self, serializer):
        blood_request = serializer.save(staff=self.request.user.staff_profile)
        alerted = 0
        try:
            alerted = len(top_up_alerts(blood_request.pk))
        except Exception:
            # A matching failure must never block the hospital from posting.
            logger.exception("Alert top-up failed for request %s", blood_request.pk)
        blood_request.alerted_count = alerted
        blood_request.accepted_count = 0

class BloodRequestDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaff]

    def get_queryset(self):
        return with_response_counts(
            BloodRequest.objects.filter(staff=self.request.user.staff_profile)
        )

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
    """Donors alerted for one of the logged-in staff member's blood requests.

    Ranked: accepted, then pending, declined and expired. Within each group an
    exact blood type match comes before a compatible one, then nearest first.
    """

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

        notifications = list(
            Notification.objects.filter(blood_request=blood_request).select_related("donor")
        )

        # Each donor's distance from the centre, using their nearest saved location.
        distances = {}
        origin = blood_request.regional_storage_center.location
        if origin is not None:
            locations = DonorLocation.objects.filter(
                donor_id__in=[n.donor_id for n in notifications]
            ).annotate(distance=Distance("point", origin))
            for loc in locations:
                metres = loc.distance.m
                if loc.donor_id not in distances or metres < distances[loc.donor_id]:
                    distances[loc.donor_id] = metres

        status_rank = {
            Notification.Status.ACCEPTED: 0,
            Notification.Status.PENDING: 1,
            Notification.Status.DECLINED: 2,
        }

        def sort_key(n):
            return (
                status_rank.get(n.status, 3),
                0 if n.donor.blood_type == blood_request.blood_type else 1,
                distances.get(n.donor_id, float("inf")),
                -n.date.timestamp(),
            )

        return sorted(notifications, key=sort_key)
        
class ReserveThresholdListView(generics.ListAPIView):
    """Minimum stock per blood type. Missing rows are created at the default."""

    serializer_class = ReserveThresholdSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaffOrKNBTSAdmin]

    def get_queryset(self):
        for blood_type, _ in BloodInventory.BLOOD_TYPE_CHOICES:
            ReserveThreshold.objects.get_or_create(blood_type=blood_type)
        return ReserveThreshold.objects.all()


class ReserveThresholdUpdateView(generics.UpdateAPIView):
    queryset = ReserveThreshold.objects.all()
    serializer_class = ReserveThresholdSerializer
    permission_classes = [permissions.IsAuthenticated, IsKNBTSAdmin]

class RequestMonitorView(generics.ListAPIView):
    """KNBTS admin view of blood requests with how many donors were alerted and
    how they responded. Open requests by default; ?status=all for everything."""

    serializer_class = RequestMonitorSerializer
    permission_classes = [permissions.IsAuthenticated, IsKNBTSAdmin]

    def get_queryset(self):
        status = self.request.query_params.get("status", BloodRequest.Status.PENDING)
        queryset = BloodRequest.objects.select_related("regional_storage_center", "staff")
        if status != "all":
            queryset = queryset.filter(status=status)

        n = Notification.Status
        return queryset.annotate(
            alerted_count=Count("notifications"),
            accepted_count=Count("notifications", filter=Q(notifications__status=n.ACCEPTED)),
            pending_count=Count("notifications", filter=Q(notifications__status=n.PENDING)),
            declined_count=Count("notifications", filter=Q(notifications__status=n.DECLINED)),
            expired_count=Count("notifications", filter=Q(notifications__status=n.EXPIRED)),
        # "critical" sorts before "standard", so ascending puts urgent first.
        ).order_by("urgency_level", "-created_at")[:50]


class RecentDonationsView(generics.ListAPIView):
    """The 20 most recent donations nationwide, for the KNBTS dashboard."""

    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated, IsKNBTSAdmin]

    def get_queryset(self):
        return Donation.objects.select_related("donor", "regional_storage_center")[:20]
    
class MyHospitalView(generics.RetrieveUpdateAPIView):
    """The logged-in staff member's hospital. Staff can read it and set its location."""

    serializer_class = MyHospitalSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaff]

    def get_object(self):
        hospital = self.request.user.staff_profile.hospital
        if hospital is None:
            raise NotFound(
                "Your account is not linked to a hospital yet. Ask a KNBTS administrator to link it."
            )
        return hospital
    
class RecordHospitalDonationView(APIView):
    """Hospital staff record a donation from a donor who accepted one of the hospital's
    requests. Adds 1 unit to the hospital's own stock and fulfils the request when
    enough units have been recorded."""

    permission_classes = [permissions.IsAuthenticated, IsHospitalStaff]

    @transaction.atomic
    def post(self, request):
        input_serializer = RecordHospitalDonationSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        hospital = request.user.staff_profile.hospital
        if hospital is None:
            return Response(
                {"detail": "Your account is not linked to a hospital yet. Ask a KNBTS administrator to link it."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        blood_request = get_object_or_404(
            BloodRequest.objects.select_for_update(of=("self",)),
            pk=input_serializer.validated_data["blood_request"],
            staff__hospital=hospital,
        )
        donor = get_object_or_404(Donor, pk=input_serializer.validated_data["donor"])

        if blood_request.status != BloodRequest.Status.PENDING:
            return Response(
                {"detail": f"This request is already {blood_request.status}."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        accepted = Notification.objects.filter(
            blood_request=blood_request, donor=donor, status=Notification.Status.ACCEPTED
        ).exists()
        if not accepted:
            return Response(
                {"detail": "This donor has not accepted this request."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        if Donation.objects.filter(blood_request=blood_request, donor=donor).exists():
            return Response(
                {"detail": "A donation from this donor is already recorded for this request."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        Donation.objects.create(
            donor=donor,
            hospital=hospital,
            blood_request=blood_request,
            blood_type=donor.blood_type,
            units_donated=1,
        )
        donor.last_donation_date = timezone.now()
        donor.save(update_fields=["last_donation_date"])

        inventory, _ = HospitalInventory.objects.get_or_create(
            hospital=hospital,
            blood_type=donor.blood_type,
            defaults={"units_available": 0},
        )
        inventory.units_available += 1
        inventory.save(update_fields=["units_available", "updated_at"])

        received = blood_request.donations.aggregate(total=Sum("units_donated"))["total"] or 0
        if received >= blood_request.units_needed:
            blood_request.status = BloodRequest.Status.FULFILLED
            blood_request.save(update_fields=["status"])

        return Response(
            {
                "donor_name": donor.full_name,
                "blood_type": donor.blood_type,
                "units_donated": 1,
                "units_received": received,
                "units_needed": blood_request.units_needed,
                "request_status": blood_request.status,
            },
            status=http_status.HTTP_201_CREATED,
        )
        
class MyHospitalInventoryView(generics.ListAPIView):
    """The blood stock held by the logged-in staff member's own hospital."""

    serializer_class = HospitalInventorySerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaff]
    pagination_class = None

    def get_queryset(self):
        hospital = self.request.user.staff_profile.hospital
        if hospital is None:
            raise NotFound(
                "Your account is not linked to a hospital yet. Ask a KNBTS administrator to link it."
            )
        return HospitalInventory.objects.filter(hospital=hospital).order_by("blood_type")