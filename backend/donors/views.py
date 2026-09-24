from rest_framework import generics, permissions

from accounts.permissions import IsDonor
from .models import Donor
from .serializers import DonorSerializer


class MyDonorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = DonorSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_object(self):
        return self.request.user.donor_profile