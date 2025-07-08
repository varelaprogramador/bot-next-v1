import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.lerjrecargas.com";

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL não está definida no ambiente.");
}

export const api = {
  get: async <T = any>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axios.get(`${API_URL}${endpoint}`, config);
  },
  post: async <T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axios.post(`${API_URL}${endpoint}`, data, config);
  },
  put: async <T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axios.put(`${API_URL}${endpoint}`, data, config);
  },
  patch: async <T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axios.patch(`${API_URL}${endpoint}`, data, config);
  },
  delete: async <T = any>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axios.delete(`${API_URL}${endpoint}`, config);
  },
};
