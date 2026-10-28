from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from donors.models import Notification

from .matching import ranked_candidates
from .models import BloodRequest

POOL_MULTIPLIER = 3

EXPIRY_WINDOWS = {
    BloodRequest.Urgency.CRITICAL: timedelta(minutes=30),
    BloodRequest.Urgency.STANDARD: timedelta(hours=4),
}


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

def expire_stale_alerts(blood_request_id=None):
    """Mark unanswered alerts as expired once their window has passed, then
    refill the pool for each affected request so the next donor is alerted.

    Pass a blood_request_id to check one request, or nothing to check all
    open requests. Returns the number of alerts expired.
    """
    now = timezone.now()
    open_alerts = Notification.objects.filter(
        status=Notification.Status.PENDING,
        blood_request__isnull=False,
        blood_request__status=BloodRequest.Status.PENDING,
    )
    if blood_request_id is not None:
        open_alerts = open_alerts.filter(blood_request_id=blood_request_id)

    stale_ids = []
    affected_requests = set()
    for urgency, window in EXPIRY_WINDOWS.items():
        rows = open_alerts.filter(
            blood_request__urgency_level=urgency,
            date__lt=now - window,
        ).values_list("pk", "blood_request_id")
        for pk, request_id in rows:
            stale_ids.append(pk)
            affected_requests.add(request_id)

    if not stale_ids:
        return 0

    Notification.objects.filter(
        pk__in=stale_ids, status=Notification.Status.PENDING
    ).update(status=Notification.Status.EXPIRED)

    for request_id in affected_requests:
        top_up_alerts(request_id)

    return len(stale_ids)