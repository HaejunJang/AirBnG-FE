import axios from 'axios';
import { getAccessToken, setAccessToken, clearTokens, isExpired } from '../utils/jwtUtil';

const baseURL = process.env.REACT_APP_API_BASE_URL || '';

export const httpPublic = axios.create({
  baseURL,
  withCredentials: true,
  validateStatus: () => true,
});

export const httpAuth = axios.create({
  baseURL,
  withCredentials: true,
  validateStatus: () => true,
});

// 라우터에서 주입받아 401 최종 실패 시 사용 (로그아웃/리다이렉트 등)
let onUnauthorized = null;
export function setOnUnauthorized(fn) { onUnauthorized = fn; }

// 매 요청에 Authorization 붙이기
httpAuth.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !isExpired(token)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// refresh 중복 호출 방지
let isRefreshing = false;
let refreshWaiters = [];
function notifyWaiters(newToken, err) {
  refreshWaiters.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(newToken)));
  refreshWaiters = [];
}

// 401 처리: /reissue 호출 → Authorization 헤더에서 새 토큰 뽑기
httpAuth.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (!response) throw error; // 네트워크 오류
    if (response.status !== 401 || config.__isRetry) throw error;

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await reissue();
        setAccessToken(newToken);
        notifyWaiters(newToken, null);
      } catch (e) {
        clearTokens();
        notifyWaiters(undefined, e);
        if (onUnauthorized) onUnauthorized();
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    // /reissue 완료 기다렸다가 원 요청 재시도
    return new Promise((resolve, reject) => {
      refreshWaiters.push({
        resolve: (newToken) => {
          const retry = { ...config, __isRetry: true };
          retry.headers = { ...(retry.headers || {}), Authorization: `Bearer ${newToken}` };
          axios.request(retry).then(resolve).catch(reject);
        },
        reject,
      });
    });
  }
);

// 실제 재발급: public로 호출 (401일 수도 있으니 reject 막기용 validateStatus 필요)
async function reissue() {
  const res = await httpPublic.post('/reissue', null, { withCredentials: true });
  const authHeader = res.headers['authorization'] || res.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No Authorization header from /reissue');
  }
  return authHeader.slice('Bearer '.length).trim();
}
