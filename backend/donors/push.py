import json
import logging

from django.conf import settings
from pywebpush import WebPushException, webpush

logger = logging.getLogger(__name__)


def build_payload(notification):
    """Short, non-personal text shown in the push."""
    request = notification.blood_request
    if request is None:
        return {
            "title": notification.message_type or "New alert",
            "body": "You have a new alert. Open the app to view it.",
            "url": "/",
        }
    title = (
        "Urgent blood request"
        if request.urgency_level == "critical"
        else "Blood request"
    )
    centre = request.regional_storage_center.region_name
    return {
        "title": title,
        "body": f"{request.blood_type} blood needed at {centre} ({request.units_needed} unit(s)).",
        "url": "/",
    }


def send_alert_push(notification):
    """Push one notification to every device the donor has enabled.

    Never raises: a failed push must not break alert creation. Devices the
    push service reports as gone (404/410) are removed. Returns the number
    of devices the push was accepted for.
    """
    if not (settings.VAPID_PRIVATE_KEY and settings.VAPID_PUBLIC_KEY):
        return 0

    payload = json.dumps(build_payload(notification))
    sent = 0
    for sub in notification.donor.push_subscriptions.all():
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_CLAIMS_SUB},
                ttl=3600,
            )
            sent += 1
        except WebPushException as exc:
            code = getattr(exc.response, "status_code", None)
            if code in (404, 410):
                sub.delete()
            else:
                logger.warning("Push to subscription %s failed: %s", sub.pk, exc)
        except Exception:
            logger.exception("Push to subscription %s failed", sub.pk)
    return sent