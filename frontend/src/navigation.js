import {
  House,
  Bell,
  MapPin,
  History,
  User,
  ClipboardList,
  Droplets,
  Droplet,
  Pencil,
  LayoutDashboard,
  Settings,
} from "lucide-react";

// Where each role lands after signing in.
export const HOME = {
  donor: "/donor",
  hospital_staff: "/hospital",
  knbts_admin: "/admin",
};

export const ROLE_LABEL = {
  donor: "Donor",
  hospital_staff: "Hospital staff",
  knbts_admin: "KNBTS administrator",
};

// Sidebar items per role.
export const NAV = {
  donor: [
    { to: "/donor", label: "Home", icon: House, end: true },
    { to: "/donor/alerts", label: "Alerts", icon: Bell, end: true },
    { to: "/donor/locations", label: "My locations", icon: MapPin, end: true },
    { to: "/donor/history", label: "Donation history", icon: History, end: true },
    { to: "/donor/profile", label: "Profile", icon: User, end: true },
  ],
  hospital_staff: [
    { to: "/hospital", label: "Requests", icon: ClipboardList, end: true },
    { to: "/hospital/stock", label: "Stock", icon: Droplets, end: true },
    { to: "/hospital/corrections", label: "Blood type corrections", icon: Pencil, end: true },
  ],
  knbts_admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/requests", label: "Requests", icon: ClipboardList, end: true },
    { to: "/admin/donations", label: "Donations", icon: Droplet, end: true },
    { to: "/admin/settings", label: "Settings", icon: Settings, end: true },
  ],
};