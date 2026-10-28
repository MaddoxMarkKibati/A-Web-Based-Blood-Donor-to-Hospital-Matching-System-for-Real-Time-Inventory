from dataclasses import dataclass

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D

from donors.models import Donor, DonorLocation, Notification

# Recipient blood type -> donor blood types that can give red cells to them.
COMPATIBLE_DONOR_TYPES = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["A-", "B-", "AB-", "O-"],
    "O+": ["O+", "O-"],
    "O-": ["O-"],
}

RADIUS_KM = 25


@dataclass
class DonorMatch:
    donor: Donor
    distance_km: float
    location_label: str
    exact_type: bool


def ranked_candidates(blood_request, radius_km=RADIUS_KM):
    """Eligible donors within radius_km of the request's centre, best first.

    Ranking: exact blood type before compatible types, then nearest first.
    Skipped: donors with no compatible type, no saved location in range,
    failing Donor.eligibility_issues(), or already alerted for this request
    (including those who declined).
    """
    origin = blood_request.regional_storage_center.location
    if origin is None:
        return []

    donor_types = COMPATIBLE_DONOR_TYPES.get(blood_request.blood_type, [])
    already_alerted = Notification.objects.filter(
        blood_request=blood_request
    ).values_list("donor_id", flat=True)

    locations = (
        DonorLocation.objects.filter(
            donor__blood_type__in=donor_types,
            point__dwithin=(origin, D(km=radius_km)),
        )
        .exclude(donor_id__in=already_alerted)
        .select_related("donor")
        .annotate(distance=Distance("point", origin))
        .order_by("distance")
    )

    matches = {}
    for loc in locations:
        donor = loc.donor
        # Ordered by distance, so the first hit per donor is their nearest location.
        if donor.id in matches or not donor.is_eligible:
            continue
        matches[donor.id] = DonorMatch(
            donor=donor,
            distance_km=loc.distance.km,
            location_label=loc.label,
            exact_type=donor.blood_type == blood_request.blood_type,
        )

    return sorted(
        matches.values(),
        key=lambda m: (not m.exact_type, m.distance_km),
    )