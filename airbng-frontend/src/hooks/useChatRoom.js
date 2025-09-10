import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useStomp from './useStomp';
import { fetchMessages, markRead } from '../api/chatApi';
import { v4 as uuid } from 'uuid';

export default function useChatRoom(convId, meId) {
  const { connected, subscribe, publish } = useStomp();
  const [messages, setMessages] = useState([]);
  const [oldestSeq, setOldestSeq] = useState(null);
  const unsubRef = useRef(null);

  // 초기 메시지 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await fetchMessages(convId, { size: 30 });
      if (!mounted) return;
      // 서버가 최신순이라면, 화면은 오래된→최신 순서가 자연스러우니 정렬 보정
      const normalized = Array.isArray(list) ? [...list].sort((a,b)=> (a.seq??0)-(b.seq??0)) : [];
      setMessages(normalized);
      const minSeq = normalized.length ? normalized[0].seq : null;
      setOldestSeq(minSeq);
    })();
    return () => { mounted = false; };
  }, [convId]);

  // 실시간 구독
  useEffect(() => {
    if (!connected) return;
    // 구독 경로: /topic/conversations.{convId}
    unsubRef.current?.();
    unsubRef.current = subscribe(`/topic/conversations.${convId}`, (frame) => {
      const msg = JSON.parse(frame.body);
      setMessages((prev) => [...prev, msg]);
    });
    return () => unsubRef.current?.();
  }, [connected, subscribe, convId]);

  // 전송(WS)
  const sendMessage = useCallback((text) => {
    if (!connected) return;
    const msgId = uuid();
    // /app/conversations/{convId}/text
    publish(`/app/conversations/${convId}/text`, { text, msgId });
  }, [connected, publish, convId]);

  // 읽음 (REST 예시)
  const markAllAsRead = useCallback(async () => {
    const lastSeq = messages.length ? messages[messages.length - 1].seq : null;
    if (lastSeq == null) return;
    try { await markRead(convId, lastSeq); } catch {/* no-op */}
  }, [convId, messages]);

  // 더보기
  const loadMore = useCallback(async () => {
    if (!oldestSeq) return;
    const older = await fetchMessages(convId, { beforeSeq: oldestSeq, size: 30 });
    if (!older?.length) return;
    const ordered = [...older].sort((a,b)=> (a.seq??0)-(b.seq??0));
    setMessages((prev) => [...ordered, ...prev]);
    const newMin = ordered.length ? ordered[0].seq : oldestSeq;
    setOldestSeq(newMin);
  }, [convId, oldestSeq]);

  // 나/상대 구분
  const withSide = useMemo(() => {
    return messages.map((m) => ({ ...m, _isMe: m.senderId === meId }));
  }, [messages, meId]);

  return { messages: withSide, sendMessage, loadMore, hasMore: !!oldestSeq, markAllAsRead };
}
