import { apiFetch } from "./client";

export async function registerUser({ email, password, role }) {
  return apiFetch("/auth/register/", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
}

export async function loginUser({ email, password }) {
  const tokens = await apiFetch("/auth/token/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
  return tokens;
}

export function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export async function fetchCurrentUser() {
  return apiFetch("/auth/me/");
}