from django.core.management.base import BaseCommand

from hospitals.alerts import expire_stale_alerts


class Command(BaseCommand):
    help = (
        "Expire unanswered donor alerts that are past their window and "
        "alert the next-ranked donors."
    )

    def handle(self, *args, **options):
        count = expire_stale_alerts()
        self.stdout.write(self.style.SUCCESS(f"Expired {count} alert(s)."))