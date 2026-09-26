from rest_framework import generics, permissions

from accounts.permissions import IsDonor
from .models import Donor, Donation, Notification
from .serializers import DonorSerializer, DonationSerializer, NotificationSerializer


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
        return Notification.objects.filter(donor=self.request.user.donor_profile)


class NotificationRespondView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_queryset(self):
        return Notification.objects.filter(donor=self.request.user.donor_profile)