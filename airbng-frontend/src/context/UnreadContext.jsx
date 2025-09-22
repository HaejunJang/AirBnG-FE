import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchInbox } from '../api/chatApi';
import { useAuth } from './AuthContext';
import usePersonalQueues from '../hooks/usePersonalQueues';

const Ctx = createContext(null);

export function UnreadProvider({ children }) {
  const { ready, isLoggedIn } = useAuth() || {};
  const [byConv, setByConv] = useState({}); // { [convId]: number }

  // 합계
  const total = useMemo(
    () => Object.values(byConv).reduce((a, b) => a + (b || 0), 0),
    [byConv]
  );

  // 로그인/로그아웃에 따라 초기화
  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) { setByConv({}); return; }

    (async () => {
      try {
        const list = await fetchInbox({ page: 0, size: 200 });
        const map = {};
        (list || []).forEach(it => { map[it.convId] = it.cachedUnread || 0; });
        setByConv(map);
      } catch {/* no-op */}
    })();
  }, [ready, isLoggedIn]);

    usePersonalQueues({
        onInboxHint: (hint) => {
            const { convId, unreadTotal } = hint || {};
            if (!convId) return;
            setByConv(prev => {
            const next = { ...prev };
            // 서버가 절대값을 주면 그 값으로, 아니면 +1
            next[convId] = Math.max(
                0,
                unreadTotal != null ? Number(unreadTotal) : (next[convId] || 0) + 1
            );
            return next;
            });
        },
    });

  return <Ctx.Provider value={{ total, byConv }}>{children}</Ctx.Provider>;
}

export function useUnread() {
  return useContext(Ctx) || { total: 0, byConv: {} };
}
