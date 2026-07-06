const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const request = async <T>(path: string): Promise<ApiResponse<T>> => {
  const response = await fetch(`${API_URL}${path}`);
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
};

export const apiClient = {
  get: request,
  baseUrl: API_URL
};

