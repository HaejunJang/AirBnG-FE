import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChatRoom from '../../hooks/useChatRoom';
import useStomp from '../../hooks/useStomp';
import usePersonalQueues from '../../hooks/usePersonalQueues';
import usePeer from '../../hooks/usePeer';
import { markRead as markReadApi } from '../../api/chatApi';
import '../../styles/chat.css';

const PEER_ACTIVE_WINDOW_MS = 8000;
const PRESENCE_PING_MS = 20000;
const RELOAD_FLAG = 'chat:reloading';
const PRESENCE_GRACE_MS = 600; // 입장 직후 배지 보류 시간

export default function ChatRoom({ convId, meId }) {
  const listRef = useRef(null);

  const [peerTyping, setPeerTyping] = useState(false);
  const typingClearRef = useRef(null);

  const lastSeenSeqRef = useRef(0);
  const [myLastReadSeq, setMyLastReadSeq] = useState(0);
  const [peerLastReadSeq, setPeerLastReadSeq] = useState(0);

  const [peerInRoom, setPeerInRoom] = useState(false);
  const [presenceSettled, setPresenceSettled] = useState(false);

  const peerActiveAtRef = useRef(0);
  const peerDecayTimerRef = useRef(null);

  const reportSeenRef = useRef(null);

  const { connected, publish } = useStomp();
  const { messages, sendMessage, loadMore, hasMore, applyAck } =
    useChatRoom(convId, meId, { ready: connected });

  const nav = useNavigate();
  const { displayName, profileUrl } = usePeer(convId);

  const personal = usePersonalQueues({
    onError: (err) => console.error('WS ERROR', err),
    onAck: (ack) => {
      const patch = {
        msgId: ack?.msgId,
        seq: ack?.seq,
        sentAtMs: ack?.sentAtMs ?? (ack?.sentAt ? Date.parse(ack.sentAt) : undefined),
      };
      if (patch.msgId) applyAck(patch);
    },
  });

  const pokePeerInRoom = useCallback(() => {
    peerActiveAtRef.current = Date.now();
    setPeerInRoom(true);
    setPresenceSettled(true); // 이벤트를 받았다는 건 handshake 완료
    clearTimeout(peerDecayTimerRef.current);
    peerDecayTimerRef.current = setTimeout(() => {
      if (Date.now() - peerActiveAtRef.current >= PEER_ACTIVE_WINDOW_MS) {
        setPeerInRoom(false);
      }
    }, PEER_ACTIVE_WINDOW_MS + 50);
    // 미세 최적화: 존재 신호를 받았으면 즉시 읽은 것으로 간주
    setPeerLastReadSeq(prev => {
      // messages는 클로저 값이므로 안전하게 한 번 더 계산하고, 더 큰 값만 적용
      // (과도하게 앞지르지 않도록 마지막 유효 seq 기준)
      // 필요 없으면 이 블록은 생략 가능
      try {
        const arr = messages || [];
        let lastValid = 0;
        for (let i = arr.length - 1; i >= 0; i--) {
          const s = Number(arr[i]?.seq);
          if (Number.isFinite(s)) { lastValid = s; break; }
        }
        return lastValid ? Math.max(prev, lastValid) : prev;
      } catch { return prev; }
    });
  }, []);

  const lastValidSeqOf = (arr = []) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      const s = Number(arr[i]?.seq);
      if (Number.isFinite(s)) return s;
    }
    return 0;
  };

  // READ 보고
  useEffect(() => {
    reportSeenRef.current = async (seq) => {
      if (!Number.isFinite(seq) || seq <= (lastSeenSeqRef.current || 0)) return;
      lastSeenSeqRef.current = seq;
      setMyLastReadSeq(seq);
      try {
        await markReadApi(convId, seq);
        publish(`/app/conversations/${convId}/read`, { lastSeenSeq: seq });
      } catch (e) {
        console.warn('markRead failed', e);
      }
    };
  }, [convId, publish]);

  // 방 전환 초기화
  useEffect(() => {
    lastSeenSeqRef.current = 0;
    setMyLastReadSeq(0);
    setPeerLastReadSeq(0);
    setPeerInRoom(false);
    setPresenceSettled(false);
    clearTimeout(peerDecayTimerRef.current);
  }, [convId]);

  // 같은 탭 새로고침 감지용 플래그
  useEffect(() => {
    const onBeforeUnload = () => {
      try { sessionStorage.setItem(RELOAD_FLAG, '1'); } catch {}
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // 최근 수신이 상대면 presence
  useEffect(() => {
    if (!messages?.length) return;
    const m = messages[messages.length - 1];
    if (m && Number(m.senderId) !== Number(meId)) {
      pokePeerInRoom();
    }
  }, [messages, meId, pokePeerInRoom]);

  // 초기 메시지로 상대 읽음 베이스라인
  useEffect(() => {
    if (!messages?.length) return;
    setPeerLastReadSeq((prev) => {
      if (prev) return prev;
      const lastPeerMsg = [...messages].reverse()
        .find((m) => Number(m.senderId) !== Number(meId) && Number.isFinite(Number(m.seq)));
      return lastPeerMsg ? Number(lastPeerMsg.seq) : 0;
    });
  }, [messages, meId]);

  // 개인큐: READ/TYPING
  useEffect(() => {
    personal.subscribeRead?.(convId, (ev) => {
      const s = Number(ev?.lastReadSeq ?? ev?.seq ?? ev?.last_seen_seq ?? NaN);
      const readerId = ev?.userId ?? ev?.readerId ?? ev?.reader ?? ev?.uid;
      if (!Number.isFinite(s)) return;

      if (Number(readerId) === Number(meId)) {
        if (s > (lastSeenSeqRef.current || 0)) {
          lastSeenSeqRef.current = s;
          setMyLastReadSeq(s);
        }
      } else {
        pokePeerInRoom();
        setPeerLastReadSeq((prev) => (s > prev ? s : prev));
      }
    });

    personal.subscribeTyping?.(convId, (ev) => {
      console.log('[TYPING EVT]', ev);
      pokePeerInRoom(); // true/false 모두 presence
      const isTyping = !!ev?.typing;
      setPeerTyping(isTyping);
      clearTimeout(typingClearRef.current);
      if (isTyping) {
        typingClearRef.current = setTimeout(() => setPeerTyping(false), 2000);
      }
    });

    return () => {
      personal.unsubscribeRead?.(convId);
      personal.unsubscribeTyping?.(convId);
      clearTimeout(typingClearRef.current);
    };
  }, [connected, convId, personal, meId, pokePeerInRoom]);

  // 같은 방이면 상대는 최신까지 읽은 것으로 간주
  useEffect(() => {
    if (!peerInRoom || !messages?.length) return;
    const lastSeq = lastValidSeqOf(messages);
    if (lastSeq) setPeerLastReadSeq((prev) => Math.max(prev, lastSeq));
  }, [peerInRoom, messages]);

  // 스크롤 바닥
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // 메시지 변화 시 내 READ 보고
  useEffect(() => {
    if (!messages?.length) return;
    const lastSeq = lastValidSeqOf(messages);
    reportSeenRef.current?.(lastSeq);
  }, [messages]);

  // 연결 직후: presence keepalive + 초기 read sync + handshake 유예
  useEffect(() => {
    if (!connected) return;

    const ping = () => publish(`/app/conversations/${convId}/typing`, { typing: false });

    ping(); // 즉시 존재 핑
    const doSync = () => {
      const lastSeq = lastValidSeqOf(messages);
      reportSeenRef.current?.(lastSeq);
    };
    doSync();
    const syncTimer = setTimeout(doSync, 200);

    // 새로고침 직후면 즉시 플래그 해제 + 배지 억제 완료 상태로
    try {
      if (sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.removeItem(RELOAD_FLAG);
        setPresenceSettled(true);
      }
    } catch {}

    // handshake 유예가 끝난 뒤부터 배지 계산 활성화
    const grace = setTimeout(() => setPresenceSettled(true), PRESENCE_GRACE_MS);

    const keep = setInterval(ping, PRESENCE_PING_MS);

    return () => {
      clearInterval(keep);
      clearTimeout(syncTimer);
      clearTimeout(grace);
    };
  }, [connected, convId, publish]);

  // 가시성 복귀 시 동기화
  useEffect(() => {
    const sync = () => {
      publish(`/app/conversations/${convId}/typing`, { typing: false });
      const lastSeq = lastValidSeqOf(messages);
      reportSeenRef.current?.(lastSeq);
    };
    const onVis = () => { if (document.visibilityState === 'visible') sync(); };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [messages, publish, convId]);

  const onSend = useCallback((text) => {
    sendMessage(text);
    publish(`/app/conversations/${convId}/typing`, { typing: false });
    const lastSeq = lastValidSeqOf(messages);
    reportSeenRef.current?.(lastSeq);
  }, [sendMessage, messages, publish, convId]);

  const onTyping = useCallback((typing) => {
    // publish(`/app/conversations/${convId}/typing`, { typing });
    const ok = publish(`/app/conversations/${convId}/typing`, { typing });
    console.log('[STOMP PUBLISH]', { dest: `/app/conversations/${convId}/typing`, typing, ok });
  }, [publish, convId]);

  return (
    <section className="chat-room">
      <header className="chat-room__header">
        <button className="chat-room__back" onClick={() => nav(-1)} aria-label="뒤로">‹</button>
        <div className="chat-room__title">{displayName}</div>
        <div className="chat-room__more" />
      </header>

      <div ref={listRef} className="chat-room__list">
        {peerTyping && <div className="chat-room__typing">상대가 입력 중…</div>}

        {hasMore && (
          <div className="center mb-16">
            <button className="btn btn--outline" onClick={loadMore}>이전 메시지 더보기</button>
          </div>
        )}

        {messages.map((m, i) => {
          const prev = i > 0 ? messages[i - 1] : null;
          const showName = Number(m.senderId) !== Number(meId) && (!prev || prev.senderId !== m.senderId);
          const isMine = Number(m?.senderId) === Number(meId);

          return (
            <ChatMessage
              key={m.msgId}
              me={isMine}
              msg={m}
              name={displayName}
              showName={showName}
              avatarUrl={Number(m.senderId) !== Number(meId) ? profileUrl : undefined}
              peerLastReadSeq={peerLastReadSeq}
              peerInRoom={peerInRoom}
              presenceSettled={presenceSettled}
            />
          );
        })}
      </div>

      <ChatInput onSend={onSend} onTyping={onTyping} />
    </section>
  );
}
