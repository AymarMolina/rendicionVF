import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BACKEND_URL,
});

axiosInstance.interceptors.request.use((config: any) => {  
  config.headers["Content-Type"] = "application/json";
  const token = localStorage.getItem("token_pae_web");
  if (token) {
    config.headers["Authorization"] = "Bearer " + token;    
  }
  return config;
});

export default axiosInstance;
