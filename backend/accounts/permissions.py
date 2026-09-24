from rest_framework.permissions import BasePermission


class IsDonor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == request.user.Role.DONOR
        )


class IsHospitalStaff(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == request.user.Role.HOSPITAL_STAFF
        )


class IsKNBTSAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == request.user.Role.ADMIN
        )


class IsHospitalStaffOrKNBTSAdmin(BasePermission):
    """Staff-side users: hospital staff and KNBTS admins share some endpoints
    (e.g. viewing regional storage center inventory)."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (
                request.user.Role.HOSPITAL_STAFF,
                request.user.Role.ADMIN,
            )
        )