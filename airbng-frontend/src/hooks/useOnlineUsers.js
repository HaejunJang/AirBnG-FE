import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchOnlineUsers } from '../api/chatApi';
import useStomp from './useStomp';

/**
 * 온라인 유저 목록을 불러오고, /topic/presence 구독으로 실시간 반영.
 * - search: 검색어 (닉네임/이름 부분일치)
 * - autoRefreshMs: 폴백 폴링(옵션) — STOMP 없으면 이걸로 갱신
 */
export default function useOnlineUsers({ search = '', limit = 50, autoRefreshMs = 0 } = {}) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const keywordRef = useRef(search);

  const { subscribe } = useStomp();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchOnlineUsers({ limit, q: keywordRef.current });
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '온라인 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // 초기/검색 변경 시 로드 (디바운스)
  useEffect(() => {
    keywordRef.current = search;
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [search, load]);

  // STOMP presence 이벤트 구독 → 간단히 재로딩
  useEffect(() => {
    // onStomp(topic, callback) 형태 가정 (네 utils/stompClient 기준)
    const off = subscribe?.('/topic/presence', () => {
      // 이벤트가 잦아도 불필요한 중복요청 줄이기 (throttle)
      if (loading) return;
      load();
    });
    return () => {
      if (typeof off === 'function') off();
    };
  }, [load, loading]);

  // 폴백 폴링(옵션): STOMP가 없거나 끊어져도 일정 주기로 리프레시
  useEffect(() => {
    if (!autoRefreshMs) return;
    const id = setInterval(load, autoRefreshMs);
    return () => clearInterval(id);
  }, [autoRefreshMs, load]);

  // id -> user 맵 (빠른 접근용)
  const byId = useMemo(() => {
    const m = new Map();
    list.forEach(u => m.set(u.id, u));
    return m;
  }, [list]);

  return { list, loading, error, reload: load, byId };
}
