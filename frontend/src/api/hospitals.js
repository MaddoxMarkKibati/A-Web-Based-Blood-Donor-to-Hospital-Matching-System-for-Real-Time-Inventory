import { apiFetch } from "./client";

export async function fetchMyStaffProfile() {
  return apiFetch("/staff/me/");
}

export async function updateMyStaffProfile(data) {
  return apiFetch("/staff/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchRegionalStorageCenters() {
  return apiFetch("/hospitals/regional-storage-centers/");
}

export async function fetchInventory(regionalStorageCenterId) {
  const query = regionalStorageCenterId
    ? `?regional_storage_center=${regionalStorageCenterId}`
    : "";
  return apiFetch(`/hospitals/inventory/${query}`);
}

export async function fetchMyRequests() {
  return apiFetch("/hospitals/requests/");
}

export async function createRequest(data) {
  return apiFetch("/hospitals/requests/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}