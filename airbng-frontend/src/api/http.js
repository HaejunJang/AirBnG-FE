import axios from "axios";

// .env 파일에 REACT_APP_API_BASE_URL 변수를 설정하여 API 기본 URL을 구성
export const API_BASE = process.env.REACT_APP_API_BASE_URL;

// 로그인 하지 않은 axios 인스턴스
export const httpPublic = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// 로그인 한 axios 인스턴스
export const httpAuth = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

httpAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
