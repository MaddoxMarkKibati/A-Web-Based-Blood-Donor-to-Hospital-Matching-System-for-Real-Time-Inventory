from django.conf import settings
from django.contrib.gis.db import models


class Donor(models.Model):
    BLOOD_TYPE_CHOICES = [
        ("A+", "A+"), ("A-", "A-"),
        ("B+", "B+"), ("B-", "B-"),
        ("AB+", "AB+"), ("AB-", "AB-"),
        ("O+", "O+"), ("O-", "O-"),
    ]

    GENDER_CHOICES = [
        ("M", "Male"),
        ("F", "Female"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="donor_profile",
    )
    first_name = models.CharField(max_length=100, blank=True)
    middle_names = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    last_donation_date = models.DateTimeField(null=True, blank=True)

    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    national_id = models.CharField(max_length=20, unique=True, null=True, blank=True)

    @property
    def full_name(self):
        parts = [self.first_name, self.middle_names, self.last_name]
        return " ".join(p for p in parts if p).strip()
    
    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.full_name or self.user.email} ({self.blood_type or 'unset'})"
    
class DonorLocation(models.Model):
    class LocationType(models.TextChoices):
        FREQUENT = "frequent", "Frequent"
        LIVE = "live", "Live"

    MAX_FREQUENT = 2
    MAX_LIVE = 1

    donor = models.ForeignKey(
        Donor,
        on_delete=models.CASCADE,
        related_name="locations",
    )
    label = models.CharField(max_length=50)
    point = models.PointField(geography=True, srid=4326)
    location_type = models.CharField(
        max_length=10,
        choices=LocationType.choices,
        default=LocationType.FREQUENT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["location_type", "-created_at"]

    def __str__(self):
        return f"{self.donor} — {self.label} ({self.location_type})"

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