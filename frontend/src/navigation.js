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

// Sidebar items per role. Later steps add pages here as they are built.
export const NAV = {
  donor: [
    { to: "/donor", label: "Home", end: true },
    { to: "/donor/alerts", label: "Alerts", end: true },
    { to: "/donor/locations", label: "My locations", end: true },
    { to: "/donor/history", label: "Donation history", end: true },
    { to: "/donor/profile", label: "Profile", end: true },
  ],
  hospital_staff: [
    { to: "/hospital", label: "Requests", end: true },
    { to: "/hospital/stock", label: "Stock", end: true },
    { to: "/hospital/corrections", label: "Blood type corrections", end: true },
  ],
  knbts_admin: [
    { to: "/admin", label: "Overview", end: true },
    { to: "/admin/requests", label: "Requests", end: true },
    { to: "/admin/donations", label: "Donations", end: true },
    { to: "/admin/settings", label: "Settings", end: true },
    { to: "/admin/classic", label: "Full dashboard (temporary)", end: true },
  ],
};