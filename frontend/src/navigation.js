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
    { to: "/donor/classic", label: "Full dashboard (temporary)", end: true },
  ],
  hospital_staff: [{ to: "/hospital", label: "Requests", end: true }],
  knbts_admin: [{ to: "/admin", label: "Overview", end: true }],
};