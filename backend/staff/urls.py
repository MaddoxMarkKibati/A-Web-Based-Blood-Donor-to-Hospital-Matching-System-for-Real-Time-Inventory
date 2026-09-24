from django.urls import path

from .views import MyStaffProfileView

urlpatterns = [
    path("me/", MyStaffProfileView.as_view(), name="staff-me"),
]