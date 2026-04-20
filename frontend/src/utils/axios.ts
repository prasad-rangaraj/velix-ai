import axios, { type AxiosInstance } from "axios";

class APIClient {
  private instance: AxiosInstance;

  constructor(baseURL: string = "http://localhost:8000") {
    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
    });
    this.initializeInterceptors();
  }

  private initializeInterceptors() {
    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token && token.length > 50) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API Error:", error.response?.data);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("auth-storage");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  GET<T>(url: string, params?: Record<string, any>) {
    return this.instance.get<T>(url, { params });
  }

  POST<T>(url: string, data?: any) {
    return this.instance.post<T>(url, data);
  }

  PUT<T>(url: string, data?: any) {
    return this.instance.put<T>(url, data);
  }

  PATCH<T>(url: string, data?: any) {
    return this.instance.patch<T>(url, data);
  }

  DELETE<T>(url: string, params?: Record<string, any>) {
    return this.instance.delete<T>(url, { params });
  }
}

export const api = new APIClient((import.meta as any).env?.VITE_API_URL || "");
