const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAccessToken() {
  return localStorage.getItem("access_token");
}

function readError(errorBody, status) {
  if (errorBody && errorBody.detail) return errorBody.detail;
  const values = Array.isArray(errorBody) ? errorBody : Object.values(errorBody || {});
  const messages = values.flat().filter((m) => typeof m === "string");
  return messages.length ? messages.join(" ") : `Request failed: ${status}`;
}

export async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(readError(errorBody, response.status));
  }

  if (response.status === 204) return null;
  return response.json();
}