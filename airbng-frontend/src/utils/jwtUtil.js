// src/utils/jwtUtil.ts
const ACCESS_KEY = 'accessToken';

// 'Bearer x.y.z' 형태가 들어와도 토큰만 추출
function normalizeToken(t) {
  if (!t) return null;
  return t.startsWith('Bearer ') ? t.slice(7).trim() : t.trim();
}

// base64url → base64 패딩 보정 후 디코딩
function decodeBase64Url(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  return atob(b64 + pad);
}

// accessToken은 sessionStorage, refreshToken은 httpOnly 쿠키(백엔드가 Set-Cookie)
export function getAccessToken() {
  const raw = sessionStorage.getItem(ACCESS_KEY) || sessionStorage.getItem('jwtToken') || null;
  return normalizeToken(raw);
}

export function setAccessToken(token) {
  const norm = normalizeToken(token);
  if (norm) {
    sessionStorage.setItem(ACCESS_KEY, norm);
    // 한 번에 마이그레이션
    sessionStorage.removeItem('jwtToken');
  }
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem('jwtToken'); // 레거시 제거(선택)
}

export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

export function isExpired(token, skewMs = 5000) {
  const p = decodeJwt(token);
  if (!p || !p.exp) return true;
  return p.exp * 1000 <= Date.now() + skewMs;
}

export function isLoggedIn() {
  const t = getAccessToken();
  return !!t && !isExpired(t);
}

// 편의 헬퍼: 백엔드 클레임 키에 맞춰 id/memberId/userId/sub 순서로 찾음
export function getMemberIdFromToken(token) {
  const t = token !== undefined ? token : getAccessToken();
  if (!t) return null;
  const p = decodeJwt(t);
  const raw = p?.id ?? p?.memberId ?? p?.userId ?? p?.sub;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}
