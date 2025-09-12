const ACCESS_KEY = 'accessToken';
const PROFILE_KEY = 'userProfile';
const REMEMBER_KEY = 'rememberMe';

function normalizeToken(t) {
  if (!t) return null;
  return t.startsWith('Bearer ') ? t.slice(7).trim() : t.trim();
}

function decodeBase64Url(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  return atob(b64 + pad);
}

export function getAccessToken() {
  const raw = sessionStorage.getItem(ACCESS_KEY) || sessionStorage.getItem('jwtToken') || null;
  return normalizeToken(raw);
}

export function setAccessToken(token) {
  const norm = normalizeToken(token);
  if (norm) {
    sessionStorage.setItem(ACCESS_KEY, norm);
    sessionStorage.removeItem('jwtToken');
  }
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem('jwtToken');
  sessionStorage.removeItem(PROFILE_KEY);
}

// ---- remember me ----
export function setRememberMe(v) {
  try { localStorage.setItem(REMEMBER_KEY, v ? '1' : '0'); } catch {}
}
export function getRememberMe() {
  try { return localStorage.getItem(REMEMBER_KEY) === '1'; } catch { return false; }
}
export function clearRememberMe() {
  try { localStorage.removeItem(REMEMBER_KEY); } catch {}
}

// ---- 사용자 프로필 저장/읽기/삭제 ----
export function setUserProfile(profile) {
  try { sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}
export function getUserProfile() {
  try {
    const s = sessionStorage.getItem(PROFILE_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}
export function clearUserProfile() { sessionStorage.removeItem(PROFILE_KEY); }

// ---- JWT helpers ----
export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload));
  } catch { return null; }
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

export function getMemberIdFromToken(token) {
  const t = token !== undefined ? token : getAccessToken();
  if (!t) return null;
  const p = decodeJwt(t);
  const raw = p && (p.id ?? p.memberId ?? p.userId ?? p.sub);
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}
