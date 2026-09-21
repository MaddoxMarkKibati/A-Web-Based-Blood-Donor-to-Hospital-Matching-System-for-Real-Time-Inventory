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