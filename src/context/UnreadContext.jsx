import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { fetchInbox } from '../api/chatApi';
import { useAuth } from './AuthContext';
import usePersonalQueues from '../hooks/usePersonalQueues';

const Ctx = createContext(null);

export function UnreadProvider({ children }) {
  const { ready, isLoggedIn } = useAuth() || {};
  const [byConv, setByConv] = useState({}); // { [convId]: number }
  const openConvRef = useRef(null); // 현재 열려있는 방 convId 저장

  // ChatRoom이 브로드캐스트하는 오픈/클로즈 이벤트 구독
  useEffect(() => {
    const onOpen = (e) => {
      const id = e?.detail?.convId ?? null;
      openConvRef.current = id;
      if (!id) return;
      // 들어오자마자 리스트 뱃지 0으로 확정
      setByConv(prev => {
        const next = { ...prev };
        next[id] = 0;
        return next;
      });
    };
    const onClose = () => { openConvRef.current = null; };
    window.addEventListener('chat:open', onOpen);
    window.addEventListener('chat:close', onClose);
    return () => {
      window.removeEventListener('chat:open', onOpen);
      window.removeEventListener('chat:close', onClose);
    };
  }, []);

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
            // 열린 방이면 서버가 몇을 주든 리스트는 0으로 고정
            if (openConvRef.current && convId === openConvRef.current) {
              setByConv(prev => {
                const next = { ...prev };
                next[convId] = 0;
                return next;
              });
              return;
            }
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
        // === 추가: 읽음 이벤트가 오면 해당 방 unread를 0으로 ===
        onInboxRead: (read) => {
          const { convId } = read || {};
          if (!convId) return;
          setByConv(prev => {
            if (!prev[convId]) return prev;
            const next = { ...prev };
            next[convId] = 0;
            return next;
          });
        },
    });

  return <Ctx.Provider value={{ total, byConv }}>{children}</Ctx.Provider>;
}

export function useUnread() {
  return useContext(Ctx) || { total: 0, byConv: {} };
}
