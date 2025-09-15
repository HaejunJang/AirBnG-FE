import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { httpPublic, setOnUnauthorized } from '../api/http';
import {
    getAccessToken, setAccessToken, clearTokens, decodeJwt, isExpired,
    setUserProfile, getUserProfile, clearUserProfile,
    getRememberMe, setRememberMe, clearRememberMe,
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
            nickname: p.nickname ?? p.name ?? '',
            roles: Array.isArray(p.roles) ? p.roles : (p.role ? [p.role] : []),
        };
    }, []);

    useEffect(() => {
        (async () => {
            const t = getAccessToken();

            // 1) 유효한 access token이면 바로 로그인 상태
            if (t && !isExpired(t)) {
                const u = buildUser(t) || {};
                const saved = getUserProfile();
                setUser({
                    id: u.id ?? saved?.id ?? null,
                    nickname: u.nickname || saved?.nickname || '',
                    roles: (u.roles && u.roles.length ? u.roles : (saved?.roles || [])),
                });
                setReady(true);
                return;
            }

            // 2) rememberMe가 '켜져 있을 때만' 조용히 재발급
            if (getRememberMe()) {
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
                            nickname: u.nickname || saved?.nickname || '',
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
                return;
            }

            // 3) rememberMe가 꺼져 있으면 즉시 비로그인
            clearTokens();
            clearUserProfile();
            setUser(null);
            setReady(true);
        })();
    }, [buildUser]);

    useEffect(() => {
        setOnUnauthorized(() => {
            // 401 글로벌 처리: 진짜 로그아웃인 경우만 실행되도록 사용처에서 호출됨
            clearTokens();
            clearUserProfile();
            setUser(null);
        });
    }, []);

    // 로그인
    const login = useCallback(async (credentials, opts = {}) => {
        const remember = credentials?.remember ?? opts?.remember ?? false; // remember 받기
        const res = await httpPublic.post('/login', credentials, { withCredentials: true });

        const body = res.data?.result ?? res.data?.data ?? res.data;
        const retryAfterHeader = res.headers?.['retry-after'];
        const remainFromBody = Number(body?.remainSeconds ?? 0);
        const retryAfter = Number(retryAfterHeader ?? remainFromBody ?? 0);

        if (!(res.status >= 200 && res.status < 300)) {
            return { ok: false, status: res.status, code: res.data?.code, message: res.data?.message ?? body?.message, retryAfter, data: body };
        }

        const authHeader = res.headers['authorization'] || res.headers['Authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
            return { ok: false, status: res.status, message: '로그인 응답에 토큰이 없습니다.' };
        }

        const token = authHeader.slice('Bearer '.length).trim();
        setAccessToken(token);

        const baseUser = buildUser(token) || {};
        const nextUser = {
            id: body?.memberId ?? body?.id ?? baseUser.id ?? null,
            nickname: body?.nickname ?? baseUser.nickname ?? '',
            roles: body?.role ? [body.role] : (baseUser.roles ?? []),
        };

        setUserProfile(nextUser);
        setUser(nextUser);
        setRememberMe(!!remember);

        //const isAdmin = body?.role == 'ADMIN' || nextUser.roles.includes('ADMIN');

        return { ok: true, status: res.status, data: body };
    }, [buildUser]);

    // 관리자 로그인 함수 추가
    const adminLogin = useCallback(async (credentials) => {
        const res = await httpPublic.post('/login', credentials, { withCredentials: true });

        const body = res.data?.result ?? res.data?.data ?? res.data;
        const retryAfterHeader = res.headers?.['retry-after'];
        const remainFromBody = Number(body?.remainSeconds ?? 0);
        const retryAfter = Number(retryAfterHeader ?? remainFromBody ?? 0);

        if (!(res.status >= 200 && res.status < 300)) {
            return {
                ok: false,
                status: res.status,
                code: res.data?.code,
                message: res.data?.message ?? body?.message,
                retryAfter,
                data: body
            };
        }

        const authHeader = res.headers['authorization'] || res.headers['Authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
            return { ok: false, status: res.status, message: '로그인 응답에 토큰이 없습니다.' };
        }

        const token = authHeader.slice('Bearer '.length).trim();

        // 관리자 권한 체크
        const baseUser = buildUser(token) || {};
        const userRole = body?.role || baseUser.roles?.[0];

        // 관리자가 아니면 로그인 거부
        if (userRole !== 'ADMIN') {
            return {
                ok: false,
                status: 403,
                message: '관리자 권한이 필요합니다.',
                code: 'ADMIN_REQUIRED'
            };
        }

        setAccessToken(token);

        const nextUser = {
            id: body?.memberId ?? body?.id ?? baseUser.id ?? null,
            nickname: body?.nickname ?? baseUser.nickname ?? '',
            roles: [userRole], // 관리자 역할 설정
        };

        setUserProfile(nextUser);
        setUser(nextUser);

        // 관리자는 자동로그인 비활성화 (보안상 좋음)
        setRememberMe(false);

        return {
            ok: true,
            status: res.status,
            data: body,
            isAdmin: true
        };
    }, [buildUser]);

    const logout = useCallback(async () => {
        try { await httpPublic.post('/logout', null, { withCredentials: true }); } catch {}
        clearTokens();
        clearUserProfile();
        clearRememberMe();        // 자동로그인 해제
        setUser(null);
    }, []);

    // updateUser 함수 추가 (올바른 위치)
    const updateUser = useCallback((updatedFields) => {
        const updatedUser = { ...user, ...updatedFields };
        setUser(updatedUser);
        setUserProfile(updatedUser);
    }, [user]);

    // 2. 권한 체크 유틸리티 함수들 추가
    const isAdmin = useCallback(() => {
        return user?.roles?.includes('ADMIN') || false;
    }, [user]);

    const hasRole = useCallback((role) => {
        return user?.roles?.includes(role) || false;
    }, [user]);

    const token = getAccessToken();
    const validToken = Boolean(token) && !isExpired(token);

    const value = useMemo(() => ({
        user,
        ready,
        isLoggedIn: Boolean(user?.id) && validToken,
        login,
        adminLogin,
        logout,
        setUser,
        updateUser, // 새로 추가된 함수
        isAdmin,      // 관리자 여부 체크 함수
        hasRole,      // 특정 역할 체크 함수
    }), [user, ready, validToken, login, adminLogin, logout, updateUser, isAdmin, hasRole]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const getCurrentUserIdFromToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.log('토큰이 없습니다');
        return null;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT 페이로드:', payload); // 디버깅용

        // 여러 가능한 필드명 시도
        const userId = payload.memberId || payload.id || payload.sub || payload.userId;
        console.log('추출된 사용자 ID:', userId); // 디버깅용

        return userId;
    } catch (error) {
        console.error('토큰 파싱 에러:', error);
        return null;
    }
};