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