from django.urls import path

from .views import (
    DonorSearchView,
    HospitalListView,
    RegionalStorageCenterListView,
    BloodInventoryListView,
    BloodInventoryUpdateView,
    BloodRequestListCreateView,
    BloodRequestDetailView,
    RecordDonationView,
    DonorBloodTypeOverrideView,
    RequestResponsesView,
)

urlpatterns = [
    path("", HospitalListView.as_view(), name="hospital-list"),
    path("regional-storage-centers/", RegionalStorageCenterListView.as_view(), name="rsc-list"),
    path("inventory/", BloodInventoryListView.as_view(), name="inventory-list"),
    path("inventory/<int:pk>/", BloodInventoryUpdateView.as_view(), name="inventory-detail"),
    path("requests/", BloodRequestListCreateView.as_view(), name="request-list-create"),
    path("requests/<int:pk>/", BloodRequestDetailView.as_view(), name="request-detail"),
    path("donations/", RecordDonationView.as_view(), name="record-donation"),
    path("donors/<int:pk>/blood-type/", DonorBloodTypeOverrideView.as_view(), name="donor-blood-type-override"),
    path("donors/", DonorSearchView.as_view(), name="donor-search"),
    path("requests/<int:pk>/responses/", RequestResponsesView.as_view(), name="request-responses"),
]