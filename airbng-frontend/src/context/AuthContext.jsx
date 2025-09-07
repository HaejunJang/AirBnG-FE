import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { httpPublic, setOnUnauthorized } from '../api/http';
import {
  getAccessToken, setAccessToken, clearTokens, decodeJwt, isExpired,
  isLoggedIn as _isLoggedIn, setUserProfile, getUserProfile, clearUserProfile
} from '../utils/jwtUtil';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const buildUser = useCallback((token) => {
    const p = decodeJwt(token);
    if (!p) return null;
    return {
      id: p.id ?? p.memberId ?? p.userId ?? p.sub ?? null,
      name: p.name ?? p.nickname ?? '',
      roles: Array.isArray(p.roles) ? p.roles : (p.role ? [p.role] : []),
    };
  }, []);

  useEffect(() => {
    (async () => {
      const t = getAccessToken();
      if (t && !isExpired(t)) {
        const u = buildUser(t) || {};
        const saved = getUserProfile();
        setUser({
          id: u.id ?? saved?.id ?? null,
          name: u.name || saved?.name || '',
          roles: (u.roles && u.roles.length ? u.roles : (saved?.roles || [])),
        });
        setReady(true);
        return;
      }
      try {
        const res = await httpPublic.post('/reissue', null, { withCredentials: true });
        const authHeader = res.headers['authorization'] || res.headers['Authorization'];
        if (authHeader?.startsWith('Bearer ')) {
          const newToken = authHeader.slice('Bearer '.length).trim();
          setAccessToken(newToken);
          const u = buildUser(newToken) || {};
          const saved = getUserProfile();
          setUser({
            id: u.id ?? saved?.id ?? null,
            name: u.name || saved?.name || '',
            roles: (u.roles && u.roles.length ? u.roles : (saved?.roles || [])),
          });
        } else {
          clearTokens(); setUser(null);
        }
      } catch {
        clearTokens(); setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, [buildUser]);

  useEffect(() => {
    setOnUnauthorized(() => {
      clearTokens();
      clearUserProfile();
      setUser(null);
    });
  }, []);

  // 로그인
  const login = useCallback(async (credentials) => {
    const res = await httpPublic.post('/login', credentials, { withCredentials: true });

    const body = res.data?.result ?? res.data?.data ?? res.data;
    const retryAfterHeader = res.headers?.['retry-after'];
    const remainFromBody = Number(body?.remainSeconds ?? 0);
    const retryAfter = Number(retryAfterHeader ?? remainFromBody ?? 0);

    // 실패 응답은 그대로 반환 (페이지에서 status/code/retryAfter로 분기)
    if (!(res.status >= 200 && res.status < 300)) {
      return {
        ok: false,
        status: res.status,
        code: res.data?.code,
        message: res.data?.message ?? body?.message,
        retryAfter,
        data: body,
      };
    }

    // 성공 → 토큰 필수
    const authHeader = res.headers['authorization'] || res.headers['Authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return { ok: false, status: res.status, message: '로그인 응답에 토큰이 없습니다.' };
    }

    const token = authHeader.slice('Bearer '.length).trim();
    setAccessToken(token);

    // 1차 토큰
    const baseUser = buildUser(token) || {};
    // 2차 바디로 보강
    const nextUser = {
      id: body?.memberId ?? body?.id ?? baseUser.id ?? null,
      name: body?.nickname ?? baseUser.name ?? '',
      roles: body?.role ? [body.role] : (baseUser.roles ?? []),
    };

    setUserProfile(nextUser);
    setUser(nextUser);

    return { ok: true, status: res.status, data: body };
  }, [buildUser]);

  const logout = useCallback(async () => {
    try { await httpPublic.post('/logout', null, { withCredentials: true }); } catch {}
    clearTokens();
    clearUserProfile();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    isLoggedIn: !!user && _isLoggedIn(),
    login,
    logout,
  }), [user, ready, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
