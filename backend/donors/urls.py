from django.urls import path

from .views import (
    MyDonorProfileView,
    MyDonationsListView,
    MyNotificationsListView,
    NotificationRespondView,
)

urlpatterns = [
    path("me/", MyDonorProfileView.as_view(), name="donor-me"),
    path("me/donations/", MyDonationsListView.as_view(), name="donor-donations"),
    path("me/notifications/", MyNotificationsListView.as_view(), name="donor-notifications"),
    path("me/notifications/<int:pk>/", NotificationRespondView.as_view(), name="donor-notification-respond"),
]