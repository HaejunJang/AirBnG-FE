import axios from 'axios';
import { getAccessToken, setAccessToken, clearTokens, isExpired } from '../utils/jwtUtil';

const baseURL = process.env.REACT_APP_API_BASE_URL || ''; // 필요시 .env로

export const httpPublic = axios.create({ baseURL, withCredentials: true });
export const httpAuth   = axios.create({ baseURL, withCredentials: true });

// 라우터에서 주입받아 401 최종 실패 시 사용 (로그아웃/리다이렉트 등)
let onUnauthorized = null;
export function setOnUnauthorized(fn) { onUnauthorized = fn; }

// 매 요청에 Authorization 붙이기
httpAuth.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !isExpired(token)) {
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

    // 이미 재시도한 요청이면 그대로 실패
    if (response.status !== 401 || config.__isRetry) throw error;

    // 동시에 여러 401이 들어오면 한 번만 /reissue 호출
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await reissue();
        setAccessToken(newToken);
        notifyWaiters(newToken, null);
      } catch (e) {
        clearTokens();
        notifyWaiters(null, e);
        if (onUnauthorized) onUnauthorized(); // 예: 로그인 페이지로
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    // /reissue 완료를 기다렸다가 원 요청 재시도
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

// 실제 재발급 호출
async function reissue() {
  // 백엔드: /reissue 성공 시
  //  - Authorization: Bearer <newAccess>
  //  - Set-Cookie: refresh=<newRefresh>; HttpOnly; ...
  const res = await httpPublic.post('/reissue', null, { withCredentials: true });
  // CORS에서 Authorization 노출하도록 백엔드가 expose 해줌(SecurityConfig.exposedHeaders)
  const authHeader = res.headers['authorization'] || res.headers['Authorization'];
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No Authorization header from /reissue');
  return authHeader.slice('Bearer '.length).trim();
}