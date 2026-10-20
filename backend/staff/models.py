from django.conf import settings
from django.db import models


class Staff(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="staff_profile",
    )
    first_name = models.CharField(max_length=100, blank=True)
    middle_names = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
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

    @property
    def full_name(self):
        parts = [self.first_name, self.middle_names, self.last_name]
        return " ".join(p for p in parts if p).strip()
    
    class Meta:
        verbose_name_plural = "staff"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return self.full_name or self.user.email