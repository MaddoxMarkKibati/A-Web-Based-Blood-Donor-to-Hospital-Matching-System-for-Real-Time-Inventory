from django.urls import path

from .views import (
    HospitalListView,
    RegionalStorageCenterListView,
    BloodInventoryListView,
    BloodInventoryUpdateView,
    BloodRequestListCreateView,
    BloodRequestDetailView,
)

urlpatterns = [
    path("", HospitalListView.as_view(), name="hospital-list"),
    path("regional-storage-centers/", RegionalStorageCenterListView.as_view(), name="rsc-list"),
    path("inventory/", BloodInventoryListView.as_view(), name="inventory-list"),
    path("inventory/<int:pk>/", BloodInventoryUpdateView.as_view(), name="inventory-detail"),
    path("requests/", BloodRequestListCreateView.as_view(), name="request-list-create"),
    path("requests/<int:pk>/", BloodRequestDetailView.as_view(), name="request-detail"),
]