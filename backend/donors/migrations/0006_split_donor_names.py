from django.db import migrations


def split_names(apps, schema_editor):
    Donor = apps.get_model("donors", "Donor")
    for donor in Donor.objects.all():
        parts = (donor.name or "").split()
        if not parts:
            continue
        donor.first_name = parts[0]
        if len(parts) > 1:
            donor.last_name = parts[-1]
        if len(parts) > 2:
            donor.middle_names = " ".join(parts[1:-1])
        donor.save(update_fields=["first_name", "middle_names", "last_name"])


class Migration(migrations.Migration):

    dependencies = [
        ('donors', '0005_donor_first_name_donor_last_name_donor_middle_names'),
    ]

    operations = [
        migrations.RunPython(split_names, migrations.RunPython.noop),
    ]