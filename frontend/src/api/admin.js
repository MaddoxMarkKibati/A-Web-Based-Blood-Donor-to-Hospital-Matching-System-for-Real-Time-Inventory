import { apiFetch } from "./client";

export async function fetchAllInventory() {
  return apiFetch("/hospitals/inventory/");
}

export async function updateInventory(id, data) {
  return apiFetch(`/hospitals/inventory/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function recordDonation(data) {
  return apiFetch("/hospitals/donations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchThresholds() {
  return apiFetch("/hospitals/thresholds/");
}

export async function updateThreshold(id, minimumUnits) {
  return apiFetch(`/hospitals/thresholds/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ minimum_units: minimumUnits }),
  });
}

export async function fetchRequestMonitor(status = "pending") {
  return apiFetch(`/hospitals/monitor/requests/?status=${encodeURIComponent(status)}`);
}

export async function fetchRecentDonations() {
  return apiFetch("/hospitals/monitor/donations/");
}