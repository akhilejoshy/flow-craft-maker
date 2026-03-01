import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

// const apiUrl = "https://api.cloudhousetechnologies.com"
const apiUrl = "https://kitfra.cloudstick.io:6443"
// const apiUrl = "http://localhost:8080"

const ApiClient: AxiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
  },
});

ApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); 
  // const token = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzE4NzM1NDEsInJvbGVfaWQiOjEsInVzZXJfaWQiOjIsInVzZXJfdHlwZSI6ImFkbWluIn0.BVnV4dtp9FURfUmPeYLLvcIv9qGru_-GM7UzFGiK4gKE40nm8TfrM_r3FPdPUQhRn0rdnaenDzWw5VCciacB2g" 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

ApiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.data.message === 'token expired' && error.config && !error.config.__isRetryRequest) {
      console.log('Error: token expired');
    }
    if (error.response?.status === 403) {
      console.log('Error: 403 Forbidden');
    }
    return Promise.reject(error);
  }
);

const api = {
  getEvents(url: string) {
    return ApiClient.get(url);
  },
  postEvents(url: string, data: Record<string, unknown> | FormData | unknown[], config?: AxiosRequestConfig) {
    return ApiClient.post(url, data, config);
  },
  deleteEvents(url: string) {
    return ApiClient.delete(url);
  },
  patchEvent(url: string, data: Record<string, unknown> | FormData | unknown[], config?: AxiosRequestConfig) {
    return ApiClient.patch(url, data,config);
  },
  putEvent(url: string, data: Record<string, unknown> | FormData, config?: AxiosRequestConfig) {
    return ApiClient.put(url, data,config);
  },
};

export { ApiClient, api };
