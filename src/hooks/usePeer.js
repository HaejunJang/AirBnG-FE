import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getPeerProfile } from '../api/chatApi';
import { peerCache } from '../utils/peerCache';

const displayNameOf = (p) =>
  (p?.nickname && p.nickname.trim()) ||
  (p?.name && p.name.trim()) ||
  '상대';

export default function usePeer(convId) {
  const { state } = useLocation();
  const stateSeed = useMemo(() => ({
    name: state?.peerName,           // ChatList에서 넘겨줌
    nickname: state?.peerNickname,   // (아래에서 넘겨줄 거야)
    profileUrl: state?.peerProfileUrl,
  }), [state]);

  const [peer, setPeer] = useState(() => {
    return peerCache.get(convId) || stateSeed || null;
  });
  const [loading, setLoading] = useState(!peer);

  // state로 들어온 정보 먼저 캐시에 싱크
  useEffect(() => {
    if (!convId) return;
    if (stateSeed && (stateSeed.name || stateSeed.nickname || stateSeed.profileUrl)) {
      if (!peerCache.has(convId)) peerCache.set(convId, stateSeed);
      setPeer(prev => prev ?? stateSeed);
    }
  }, [convId, stateSeed]);

  // 캐시에 없으면 서버 조회
  useEffect(() => {
    let alive = true;
    if (!convId) return;
    if (peerCache.has(convId)) { setLoading(false); return; }

    (async () => {
      try {
        setLoading(true);
        const p = await getPeerProfile(convId);
        if (!alive) return;
        peerCache.set(convId, p);
        setPeer(p);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [convId]);

  return {
    peer,
    displayName: displayNameOf(peer),
    profileUrl: peer?.profileUrl || null,
    loading,
  };
}