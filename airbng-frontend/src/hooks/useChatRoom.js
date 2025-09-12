import { useCallback, useEffect, useMemo, useState } from 'react';
import useStomp from './useStomp';
import { fetchMessages } from '../api/chatApi';
import { v4 as uuid } from 'uuid';
import useConversationTopic from './useConversationTopic';

export default function useChatRoom(convId, meId) {
  const { publish } = useStomp();
  const [messages, setMessages] = useState([]);
  const [oldestSeq, setOldestSeq] = useState(null);

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

  // 실시간 브로드캐스트 구독 (서버에서 /topic/conversations.{convId} 로 쏨)
  const handleTopic = useCallback((msg) => {
    setMessages((prev) => {
      // 중복(같은 msgId) 오면 병합
      const i = prev.findIndex(m => m.msgId === msg.msgId);
      if (i >= 0) {
        const next = prev.slice();
        next[i] = { ...prev[i], ...msg, _pending: false };
        return next;
      }
      return [...prev, msg];
    });
  }, [convId, meId]);
  useConversationTopic(convId, handleTopic);

  // 전송(WS)
  const sendMessage = useCallback((text) => {
    const msgId = uuid();

    // 1) 화면에 즉시 추가 (임시 메시지)
    const temp = {
      convId,
      msgId,
      senderId: meId,
      text,
      seq: null,
      sentAt: new Date().toISOString(),
      _pending: true, 
    };
    setMessages((prev) => [...prev, temp]);
    // /app/conversations/{convId}/text
    publish(`/app/conversations/${convId}/text`, { text, msgId });
    return msgId;
  }, [publish, convId, meId]);

  const applyAck = useCallback((ack) => {
    if (!ack?.msgId) return;
    setMessages(prev => prev.map(m => 
      m.msgId === ack.msgId ? { ...m, seq: ack.seq, sentAt: ack.sentAt, _pending: false } : m
    ));
  }, []);

  // 읽음 (REST 예시)
  const markAllAsRead = useCallback(() => {
    const lastSeq = messages.length ? messages[messages.length - 1].seq : null;
    if (lastSeq == null) return;
    publish(`/app/conversations/${convId}/read`, { lastSeenSeq: lastSeq });
  }, [publish, convId, messages]);

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

  return { messages: withSide, sendMessage, loadMore, hasMore: !!oldestSeq, markAllAsRead, applyAck };
}
