const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const AUTH_TOKEN_KEY = "onlinebooking_admin_token";

export const getAdminToken = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
};

export const setAdminToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAdminToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const token = getAdminToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    cache: "no-store"
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    if (response.status === 401) clearAdminToken();
    throw new Error(payload.message || "Request failed");
  }

  return payload.data as T;
}
