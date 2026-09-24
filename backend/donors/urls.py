from django.urls import path

from .views import MyDonorProfileView

urlpatterns = [
    path("me/", MyDonorProfileView.as_view(), name="donor-me"),
]