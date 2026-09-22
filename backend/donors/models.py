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
    
class Donation(models.Model):
    donor = models.ForeignKey(
        Donor,
        on_delete=models.CASCADE,
        related_name="donations",
    )
    regional_storage_center = models.ForeignKey(
        "hospitals.RegionalStorageCenter",
        on_delete=models.CASCADE,
        related_name="donations",
    )
    blood_type = models.CharField(max_length=3, choices=Donor.BLOOD_TYPE_CHOICES)
    units_donated = models.PositiveIntegerField(default=1)
    donation_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-donation_date"]

    def __str__(self):
        return f"{self.donor} — {self.units_donated} unit(s) on {self.donation_date:%Y-%m-%d}"


class Notification(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        EXPIRED = "expired", "Expired"

    donor = models.ForeignKey(
        Donor,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    blood_request = models.ForeignKey(
        "hospitals.BloodRequest",
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    message_type = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.donor} — {self.status}"