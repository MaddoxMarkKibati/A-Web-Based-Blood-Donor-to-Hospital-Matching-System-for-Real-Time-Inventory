import { apiFetch } from "./client";

export async function fetchMyProfile() {
  return apiFetch("/donors/me/");
}

export async function updateMyProfile(data) {
  return apiFetch("/donors/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchMyDonations() {
  return apiFetch("/donors/me/donations/");
}

export async function fetchMyNotifications() {
  return apiFetch("/donors/me/notifications/");
}