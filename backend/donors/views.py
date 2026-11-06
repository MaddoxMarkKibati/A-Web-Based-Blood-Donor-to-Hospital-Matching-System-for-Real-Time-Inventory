import logging
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.gis.geos import Point
from accounts.permissions import IsDonor
from .models import Donor, Donation, Notification, PushSubscription, DonorLocation
from .serializers import DonorSerializer, DonorLocationSerializer, DonationSerializer, NotificationSerializer, LiveLocationSerializer
from hospitals.alerts import expire_stale_alerts, top_up_alerts

logger = logging.getLogger(__name__)
def expire_quietly():
    try:
        expire_stale_alerts()
    except Exception:
        # Expiry must never stop a donor from seeing or answering alerts.
        logger.exception("Alert expiry failed")

class MyDonorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = DonorSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_object(self):
        return self.request.user.donor_profile
    
class MyDonationsListView(generics.ListAPIView):
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_queryset(self):
        return Donation.objects.filter(donor=self.request.user.donor_profile)


class MyNotificationsListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_queryset(self):
        expire_quietly()
        return Notification.objects.filter(
            donor=self.request.user.donor_profile
        ).select_related("blood_request__regional_storage_center")


class NotificationRespondView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        expire_quietly()
        
    def get_queryset(self):
        return Notification.objects.filter(
            donor=self.request.user.donor_profile
        ).select_related("donor", "blood_request__regional_storage_center")
        
    def perform_update(self, serializer):
        notification = serializer.save()
        if (
            notification.status == Notification.Status.DECLINED
            and notification.blood_request_id
        ):
            try:
                top_up_alerts(notification.blood_request_id)
            except Exception:
                # A matching failure must never block a donor's answer.
                logger.exception(
                    "Alert refill failed for request %s", notification.blood_request_id
                )

class MyLocationsListCreateView(generics.ListCreateAPIView):
    serializer_class = DonorLocationSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_queryset(self):
        return self.request.user.donor_profile.locations.all()

    def perform_create(self, serializer):
        serializer.save(donor=self.request.user.donor_profile)


class MyLocationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DonorLocationSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_queryset(self):
        return self.request.user.donor_profile.locations.all()
    
class PushSubscriptionView(APIView):
    """Save (POST) or remove (DELETE) the logged-in donor's push subscription
    for one device. POST takes the browser's subscription JSON."""

    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def post(self, request):
        keys = request.data.get("keys") or {}
        endpoint = request.data.get("endpoint")
        p256dh = keys.get("p256dh")
        auth = keys.get("auth")
        if not (endpoint and p256dh and auth):
            return Response(
                {"detail": "endpoint and keys (p256dh, auth) are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                "donor": request.user.donor_profile,
                "p256dh": p256dh,
                "auth": auth,
            },
        )
        return Response(status=status.HTTP_201_CREATED)

    def delete(self, request):
        endpoint = request.data.get("endpoint")
        if not endpoint:
            return Response(
                {"detail": "endpoint is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        PushSubscription.objects.filter(
            donor=request.user.donor_profile, endpoint=endpoint
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class LiveLocationView(APIView):
    """PUT sets or refreshes the donor's live location. DELETE stops sharing and
    removes it."""

    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def put(self, request):
        serializer = LiveLocationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lat = serializer.validated_data["lat"]
        lng = serializer.validated_data["lng"]
        location, _ = DonorLocation.objects.update_or_create(
            donor=request.user.donor_profile,
            location_type=DonorLocation.LocationType.LIVE,
            defaults={"label": "Live location", "point": Point(lng, lat, srid=4326)},
        )
        return Response({"lat": lat, "lng": lng, "updated_at": location.updated_at})

    def delete(self, request):
        request.user.donor_profile.locations.filter(
            location_type=DonorLocation.LocationType.LIVE
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)