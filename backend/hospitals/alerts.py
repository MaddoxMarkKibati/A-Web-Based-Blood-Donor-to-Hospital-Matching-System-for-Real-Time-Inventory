from django.db import transaction

from donors.models import Notification

from .matching import ranked_candidates
from .models import BloodRequest

POOL_MULTIPLIER = 3


@transaction.atomic
def top_up_alerts(blood_request_id):
    """Alert the best-ranked unalerted donors until the pool is full.

    The pool holds up to POOL_MULTIPLIER x units_needed active alerts
    (pending or accepted). Declined alerts free a slot, which is how a
    decline pulls in the next donor. Does nothing once the request is no
    longer pending or enough donors have accepted.

    Returns the list of Notification rows created.
    """
    # Lock the request row so two simultaneous declines cannot both
    # fill the same slot.
    blood_request = (
        BloodRequest.objects.select_for_update(of=("self",))
        .select_related("regional_storage_center")
        .get(pk=blood_request_id)
    )

    if blood_request.status != BloodRequest.Status.PENDING:
        return []

    alerts = Notification.objects.filter(blood_request=blood_request)
    accepted = alerts.filter(status=Notification.Status.ACCEPTED).count()
    if accepted >= blood_request.units_needed:
        return []

    active = alerts.filter(
        status__in=[Notification.Status.PENDING, Notification.Status.ACCEPTED]
    ).count()
    slots = POOL_MULTIPLIER * blood_request.units_needed - active
    if slots <= 0:
        return []

    message_type = (
        "Urgent request"
        if blood_request.urgency_level == BloodRequest.Urgency.CRITICAL
        else "Blood request"
    )

    created = []
    for match in ranked_candidates(blood_request)[:slots]:
        notification, was_created = Notification.objects.get_or_create(
            donor=match.donor,
            blood_request=blood_request,
            defaults={"message_type": message_type},
        )
        if was_created:
            created.append(notification)
    return created