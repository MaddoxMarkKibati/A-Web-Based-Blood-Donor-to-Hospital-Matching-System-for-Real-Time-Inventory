from django.contrib.gis.db import models


class Hospital(models.Model):
    name = models.CharField(max_length=150)
    address = models.CharField(max_length=255)
    contact_info = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class RegionalStorageCenter(models.Model):
    region_name = models.CharField(max_length=100)
    county = models.CharField(max_length=100)
    location = models.PointField(geography=True, srid=4326, null=True, blank=True)

    class Meta:
        ordering = ["region_name"]

    def __str__(self):
        return f"{self.region_name} ({self.county})"
    
class BloodInventory(models.Model):
    BLOOD_TYPE_CHOICES = [
        ("A+", "A+"), ("A-", "A-"),
        ("B+", "B+"), ("B-", "B-"),
        ("AB+", "AB+"), ("AB-", "AB-"),
        ("O+", "O+"), ("O-", "O-"),
    ]

    regional_storage_center = models.ForeignKey(
        RegionalStorageCenter,
        on_delete=models.CASCADE,
        related_name="inventory",
    )
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES)
    units_available = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["regional_storage_center", "blood_type"],
                name="unique_inventory_per_rsc_blood_type",
            )
        ]
        verbose_name_plural = "blood inventory"

    def __str__(self):
        return f"{self.regional_storage_center} — {self.blood_type}: {self.units_available}"


class BloodRequest(models.Model):
    BLOOD_TYPE_CHOICES = BloodInventory.BLOOD_TYPE_CHOICES

    class Urgency(models.TextChoices):
        CRITICAL = "critical", "Critical"
        STANDARD = "standard", "Standard"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        FULFILLED = "fulfilled", "Fulfilled"
        CANCELLED = "cancelled", "Cancelled"

    regional_storage_center = models.ForeignKey(
        RegionalStorageCenter,
        on_delete=models.CASCADE,
        related_name="requests",
    )
    staff = models.ForeignKey(
        "staff.Staff",
        on_delete=models.SET_NULL,
        null=True,
        related_name="blood_requests",
    )
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES)
    units_needed = models.PositiveIntegerField()
    urgency_level = models.CharField(max_length=20, choices=Urgency.choices, default=Urgency.STANDARD)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.blood_type} x{self.units_needed} ({self.status})"