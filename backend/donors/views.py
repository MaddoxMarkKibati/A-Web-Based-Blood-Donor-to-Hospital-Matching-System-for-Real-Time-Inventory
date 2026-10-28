import logging
from rest_framework import generics, permissions

from accounts.permissions import IsDonor
from .models import Donor, Donation, Notification
from .serializers import DonorSerializer, DonorLocationSerializer, DonationSerializer, NotificationSerializer
from hospitals.alerts import top_up_alerts
logger = logging.getLogger(__name__)

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
        return Notification.objects.filter(
            donor=self.request.user.donor_profile
        ).select_related("blood_request__regional_storage_center")


class NotificationRespondView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

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