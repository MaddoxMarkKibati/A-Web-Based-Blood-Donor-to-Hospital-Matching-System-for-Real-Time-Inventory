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

export async function fetchMyLocations() {
  return apiFetch("/donors/me/locations/");
}

export async function createLocation(data) {
  return apiFetch("/donors/me/locations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLocation(id, data) {
  return apiFetch(`/donors/me/locations/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteLocation(id) {
  return apiFetch(`/donors/me/locations/${id}/`, {
    method: "DELETE",
  });
}