const ACCESS_KEY = 'accessToken';
const PROFILE_KEY = 'userProfile';

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
    // 레거시 키 제거(선택)
    sessionStorage.removeItem('jwtToken');
  }
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem('jwtToken'); // 레거시 제거(선택)
  sessionStorage.removeItem(PROFILE_KEY); // 저장된 프로필도 같이 제거
}

// ---- 사용자 프로필 저장/읽기/삭제 (nickname 유지용) ----
export function setUserProfile(profile) {
  try {
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export function getUserProfile() {
  try {
    const s = sessionStorage.getItem(PROFILE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function clearUserProfile() {
  sessionStorage.removeItem(PROFILE_KEY);
}

// ---- JWT decode & helpers ----
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
  const raw = p && (p.id ?? p.memberId ?? p.userId ?? p.sub);
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}
