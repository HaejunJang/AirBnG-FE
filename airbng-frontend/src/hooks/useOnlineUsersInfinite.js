import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchOnlineUsersPage } from '../api/chatApi';
import useStomp from './useStomp';

export default function useOnlineUsersInfinite({
  search = '',
  size = 20,
  includeMe = false,
  autoRefreshMs = 0,
} = {}) {
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { subscribe } = useStomp();

  const qRef = useRef(search);
  const runIdRef = useRef(0);       // 검색/리셋 세션 id (레이스 방지)
  const loadingRef = useRef(false); // 실시간 로딩 가드
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

  const loadPage = useCallback(async (nextOffset = 0, append = true) => {
    if (loadingRef.current) return;
    const myRun = runIdRef.current;

    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await fetchOnlineUsersPage({
        offset: nextOffset,
        size,
        q: qRef.current,
        includeMe,
      });

      // 검색/리셋이 그 사이 바뀐 경우 결과 무시
      if (myRun !== runIdRef.current) return;

      const rows = Array.isArray(data?.items) ? data.items : [];
      setItems(prev => (append ? [...prev, ...rows] : rows));
      setOffset(Number.isFinite(data?.nextOffset) ? data.nextOffset : nextOffset + rows.length);
      setHasMore(Boolean(data?.hasMore));
      setError('');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '온라인 목록을 불러오지 못했습니다.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [size, includeMe]);

  // 검색어 변경 → 리셋 로드 (디바운스 + 세션 갱신)
  useEffect(() => {
    qRef.current = search;
    runIdRef.current += 1;          // 새로운 검색 세션
    setItems([]);
    setOffset(0);
    setHasMore(true);
    const t = setTimeout(() => loadPage(0, false), 220);
    return () => clearTimeout(t);
  }, [search, loadPage]);

  // IntersectionObserver (ref 기반 가드 사용)
  useEffect(() => {
    const root = containerRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const io = new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (first?.isIntersecting && hasMore && !loadingRef.current) {
          loadPage(offset, true);
        }
      },
      { root, rootMargin: '120px', threshold: 0.01 }
    );

    io.observe(target);
    return () => io.disconnect();
  }, [offset, hasMore, loadPage]);

  // STOMP 이벤트 → 소프트 리프레시 (쓰로틀)
  useEffect(() => {
    let timer = null;
    const handler = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        runIdRef.current += 1;
        setItems([]);
        setOffset(0);
        setHasMore(true);
        loadPage(0, false);
      }, 300);
    };
    const off = subscribe?.('/topic/presence', handler);
    return () => {
      if (typeof off === 'function') off();
      if (timer) clearTimeout(timer);
    };
  }, [loadPage]);

  // 폴백 폴링
  useEffect(() => {
    if (!autoRefreshMs) return;
    const id = setInterval(() => {
      runIdRef.current += 1;
      loadPage(0, false);
    }, autoRefreshMs);
    return () => clearInterval(id);
  }, [autoRefreshMs, loadPage]);

  const byId = useMemo(() => {
    const m = new Map();
    items.forEach(u => m.set(u.id, u));
    return m;
  }, [items]);

  return {
    items,
    byId,
    loading,
    error,
    hasMore,
    offset,
    containerRef,
    sentinelRef,
    reload: () => {
      runIdRef.current += 1;
      loadPage(0, false);
    },
  };
}
