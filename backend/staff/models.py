from django.conf import settings
from django.db import models


class Staff(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="staff_profile",
    )
    name = models.CharField(max_length=150)
    role = models.CharField(max_length=50)
    hospital = models.ForeignKey(
        "hospitals.Hospital",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="staff_members",
    )
    regional_storage_center = models.ForeignKey(
        "hospitals.RegionalStorageCenter",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_members",
    )

    class Meta:
        verbose_name_plural = "staff"

    def __str__(self):
        return self.name