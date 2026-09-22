from django.conf import settings
from django.contrib.gis.db import models


class Donor(models.Model):
    BLOOD_TYPE_CHOICES = [
        ("A+", "A+"), ("A-", "A-"),
        ("B+", "B+"), ("B-", "B-"),
        ("AB+", "AB+"), ("AB-", "AB-"),
        ("O+", "O+"), ("O-", "O-"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="donor_profile",
    )
    name = models.CharField(max_length=150)
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES)
    phone = models.CharField(max_length=20, blank=True)
    location = models.PointField(geography=True, srid=4326, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    last_donation_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.blood_type})"