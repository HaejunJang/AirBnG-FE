import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { httpPublic, setOnUnauthorized } from '../api/http';
import { getAccessToken, setAccessToken, clearTokens, decodeJwt, isExpired, isLoggedIn } from '../utils/jwtUtil';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  const [ready, setReady] = useState(false);

  const buildUser = useCallback((token) => {
    const p = decodeJwt(token);
    if (!p) return null;
    return {
      id: p.memberId ?? p.userId ?? p.sub ?? null,
      name: p.name ?? p.nickname ?? '',
      roles: Array.isArray(p.roles) ? p.roles : (p.role ? [p.role] : []),
    };
  }, []);

  // 앱 시작: access 만료/부재면 /reissue 시도
  useEffect(() => {
    (async () => {
      const t = getAccessToken();
      if (t && !isExpired(t)) {
        setUser(buildUser(t));
        setReady(true);
        return;
      }
      try {
        const res = await httpPublic.post('/reissue', null, { withCredentials: true });
        const authHeader = res.headers['authorization'] || res.headers['Authorization'];
        if (authHeader?.startsWith('Bearer ')) {
          const newToken = authHeader.slice('Bearer '.length).trim();
          setAccessToken(newToken);
          setUser(buildUser(newToken));
        } else {
          clearTokens();
          setUser(null);
        }
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, [buildUser]);

  // axios에서 refresh 실패(401 연쇄) 시 처리
  useEffect(() => {
    setOnUnauthorized(() => {
      clearTokens();
      setUser(null);
    });
  }, []);

  // 로그인: /login 성공 시 Authorization 헤더에서 access 추출 + refresh 쿠키 자동 저장
  const login = useCallback(async (credentials) => {
    // 백엔드 CustomAuthenticationFilter JSON 키에 맞추자! 예: { email, password } 또는 { username, password }
    const res = await httpPublic.post('/login', credentials, { withCredentials: true });
    const authHeader = res.headers['authorization'] || res.headers['Authorization'];
    if (!authHeader?.startsWith('Bearer ')) return { ok: false, message: '로그인 응답에 토큰이 없습니다.' };
    const token = authHeader.slice('Bearer '.length).trim();
    setAccessToken(token);
    setUser(buildUser(token));
    return { ok: true };
  }, [buildUser]);

  const logout = useCallback(async () => {
    try { await httpPublic.post('/logout', null, { withCredentials: true }); } catch {}
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    isLoggedIn: !!user && isLoggedIn(),
    login,
    logout,
  }), [user, ready, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
