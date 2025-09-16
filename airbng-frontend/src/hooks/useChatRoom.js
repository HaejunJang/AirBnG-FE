import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useStomp from './useStomp';
import { fetchMessages } from '../api/chatApi';
import { v4 as uuid } from 'uuid';
import useConversationTopic from './useConversationTopic';

const OUTBOX_TTL_MS = 15000;  // 새로고침용: 짧게 유지
const ACK_TIMEOUT_MS = 12000;

// 새로고침(같은 탭)에서만 살아있게 sessionStorage 사용
function lsKey(convId, meId) { return `outbox:${convId}:${meId}`; }
function loadOutbox(convId, meId) {
  try { return JSON.parse(sessionStorage.getItem(lsKey(convId, meId)) || '[]'); } catch { return []; }
}
function saveOutbox(convId, meId, arr) {
  try { sessionStorage.setItem(lsKey(convId, meId), JSON.stringify(arr)); } catch {}
}

export default function useChatRoom(convId, meId, { ready = true } = {}) {
  const { publish } = useStomp();
  const [messages, setMessages] = useState([]);
  const [oldestSeq, setOldestSeq] = useState(null);

  // ACK 전 임시 큐 & 타이머
  const outboxRef = useRef([]); // [{msgId,text,sentAt:number}]
  const timersRef = useRef(new Map()); // msgId -> timeoutId
  const ensureSave = () => saveOutbox(convId, meId, outboxRef.current);

  // === 공통 플러시 함수 ===
  const _publishText = useCallback((text, msgId) => {
    publish(`/app/conversations/${convId}/text`, { text, msgId });
  }, [publish, convId]);

  const flushOutbox = useCallback(() => {
    if (!ready || !outboxRef.current.length) return;
    for (const it of outboxRef.current) _publishText(it.text, it.msgId);
  }, [ready, _publishText]);

  // helper: 펜딩 메시지 제거(화면+outbox)
  const dropPending = useCallback((msgId) => {
    setMessages(prev => prev.filter(m => !(m.msgId === msgId && (m._pending || m.seq == null))));
    outboxRef.current = outboxRef.current.filter(o => o.msgId !== msgId);
    ensureSave();
    const t = timersRef.current.get(msgId);
    if (t) { clearTimeout(t); timersRef.current.delete(msgId); }
  }, [convId, meId]);

  // 초기 메시지 + outbox 복원(단, TTL 지난 건 복원 X)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await fetchMessages(convId, { size: 30 });
      if (!mounted) return;
      const normalized = Array.isArray(list) ? [...list].sort((a,b)=> (a.seq??0)-(b.seq??0)) : [];
      setMessages(normalized);
      setOldestSeq(normalized.length ? normalized[0].seq : null);

      // TTL 지난 유령 제거 후 복원
      const now = Date.now();
      outboxRef.current = loadOutbox(convId, meId)
        .filter(o => (now - (o.sentAt ?? now)) < OUTBOX_TTL_MS);

      if (outboxRef.current.length) {
        setMessages(prev => {
          const have = new Set(prev.map(m => m.msgId));
          const pendings = outboxRef.current
            .filter(o => !have.has(o.msgId))
            .map(o => ({
              convId,
              msgId: o.msgId,
              senderId: meId,
              text: o.text,
              seq: null,
              sentAt: new Date(o.sentAt || now).toISOString(),
              _pending: true,
            }));
          return [...prev, ...pendings];
        });

        // 복원된 펜딩들에 타임아웃 스케줄링(ACK 없으면 자동 삭제)
        for (const o of outboxRef.current) {
          const remain = Math.max(0, ACK_TIMEOUT_MS - (now - (o.sentAt ?? now)));
          const id = setTimeout(() => dropPending(o.msgId), remain);
          timersRef.current.set(o.msgId, id);
        }
        // 복원 직후 즉시 플러시(ready가 이미 true였던 리로드 케이스 커버)
        flushOutbox();
      }
    })();
    return () => { mounted = false; };
  }, [convId, meId, dropPending, flushOutbox]);

  // 토픽 수신(정상 저장된 메시지 에코)
  const handleTopic = useCallback((msg) => {
    setMessages((prev) => {
      const i = prev.findIndex(m => m.msgId === msg.msgId);
      if (i >= 0) {
        const next = prev.slice();
        next[i] = { ...prev[i], ...msg, _pending: false };
        return next;
      }
      return [...prev, msg];
    });
    // 에코가 왔으면 outbox/타이머 정리
    if (msg?.msgId) dropPending(msg.msgId);
  }, [dropPending]);
  useConversationTopic(convId, handleTopic);

  const sendMessage = useCallback((text) => {
    const msgId = uuid();
    const sentAtNum = Date.now();

    // 화면에 즉시 추가
    const temp = {
      convId, msgId, senderId: meId, text,
      seq: null, sentAt: new Date(sentAtNum).toISOString(), _pending: true
    };
    setMessages((prev) => [...prev, temp]);

    // 보내고, "못 보냈을 때만" outbox에 기록
    const sentNow = _publishText(text, msgId);
    if (!sentNow) {
      outboxRef.current.push({ msgId, text, sentAt: sentAtNum });
      ensureSave();
      const t = setTimeout(() => dropPending(msgId), ACK_TIMEOUT_MS);
      timersRef.current.set(msgId, t);
    } else {
      // 보냈으면 ACK만 기다렸다가 dropPending(ack)에서 정리됨
      // 혹시 ACK가 끝내 안 오면(서버 이슈) 임시 뷰만 남을 수 있으니,
      // "보냈을 때만" 약한 안전장치(예: 30초 후 펜딩 제거) 넣고 싶으면 여기에서만 타이머를 건다.
      const t = setTimeout(() => dropPending(msgId), ACK_TIMEOUT_MS);
      timersRef.current.set(msgId, t);
    }
      return msgId;
    }, [convId, meId, _publishText, dropPending]);

  // 브라우저가 offline -> online 되면 즉시 플러시
  useEffect(() => {
    const onOnline = () => flushOutbox();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [flushOutbox]);

  // 포커스/가시성 복귀 시도(모바일 백그라운드 후 복귀 커버)
  useEffect(() => {
    const flush = () => flushOutbox();
    const onVis = () => { if (document.visibilityState === 'visible') flush(); };
    window.addEventListener('focus', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [flushOutbox]);

  // ACK 병합 + 정리
  const applyAck = useCallback((ack) => {
    if (!ack?.msgId) return;
    setMessages(prev => prev.map(m =>
      m.msgId === ack.msgId ? { ...m, seq: ack.seq, sentAt: ack.sentAt ?? m.sentAt, _pending: false } : m
    ));
    dropPending(ack.msgId);
  }, [dropPending]);

  // 더보기
  const loadMore = useCallback(async () => {
    if (!oldestSeq) return;
    const older = await fetchMessages(convId, { beforeSeq: oldestSeq, size: 30 });
    if (!older?.length) return;
    const ordered = [...older].sort((a,b)=> (a.seq??0)-(b.seq??0));
    setMessages((prev) => [...ordered, ...prev]);
    setOldestSeq(ordered.length ? ordered[0].seq : oldestSeq);
  }, [convId, oldestSeq]);

  // 나/상대 구분
  const withSide = useMemo(() => {
    const myIdNum = Number(meId);
    return messages.map((m) => ({ ...m, _isMe: Number(m?.senderId) === myIdNum }));
  }, [messages, meId]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      for (const id of timersRef.current.values()) clearTimeout(id);
      timersRef.current.clear();
    };
  }, []);

  return { messages: withSide, sendMessage, loadMore, hasMore: !!oldestSeq, applyAck };
}
