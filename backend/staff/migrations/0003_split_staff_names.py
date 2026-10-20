from django.db import migrations


def split_names(apps, schema_editor):
    Staff = apps.get_model("staff", "Staff")
    for member in Staff.objects.all():
        parts = (member.name or "").split()
        if not parts:
            continue
        member.first_name = parts[0]
        if len(parts) > 1:
            member.last_name = parts[-1]
        if len(parts) > 2:
            member.middle_names = " ".join(parts[1:-1])
        member.save(update_fields=["first_name", "middle_names", "last_name"])


class Migration(migrations.Migration):

    dependencies = [
        ('staff', '0002_staff_first_name_staff_last_name_staff_middle_names'),
    ]

    operations = [
        migrations.RunPython(split_names, migrations.RunPython.noop),
    ]