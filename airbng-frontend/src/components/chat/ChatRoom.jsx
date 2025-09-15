import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChatRoom from '../../hooks/useChatRoom';
import useStomp from '../../hooks/useStomp';
import usePersonalQueues from '../../hooks/usePersonalQueues';
import usePeer from '../../hooks/usePeer';
import { markRead as markReadApi } from '../../api/chatApi';
import '../../styles/chat.css';

export default function ChatRoom({ convId, meId }) {
  const listRef = useRef(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingClearRef = useRef(null);
  const lastSeenSeqRef = useRef(0);           // 서버에 보낸 내 마지막 읽음 seq 기억
  const [myLastReadSeq, setMyLastReadSeq] = useState(0); // NEW: 렌더링용 로컬 상태
  const [peerLastReadSeq, setPeerLastReadSeq] = useState(0);
  const [peerInRoom, setPeerInRoom] = useState(false);
  const reportSeenRef = useRef(null);

  const { connected, publish } = useStomp();
  const { messages, sendMessage, loadMore, hasMore, applyAck } =
    useChatRoom(convId, meId);

  // const { state } = useLocation();
  // const title = state?.peerName || '상대';
  const nav = useNavigate();

  const { displayName, profileUrl } = usePeer(convId);

  const personal = usePersonalQueues({
    onError: (err) => console.error('WS ERROR', err),
  });

  const lastValidSeqOf = (arr = []) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      const s = Number(arr[i]?.seq);
      if (Number.isFinite(s)) return s;
    }
    return 0;
  };

  // READ 보고 함수 (과거 seq면 중복 보고 방지)
  useEffect(() => {
    reportSeenRef.current = async (seq) => {
      if (!Number.isFinite(seq) || seq <= (lastSeenSeqRef.current || 0)) return;
      lastSeenSeqRef.current = seq;
      setMyLastReadSeq(seq);
      try {
        // 1) REST: 서버 상태 저장
       await markReadApi(convId, seq);
       // 2) WS: 브로커 경유 브로드캐스트 (상대에게 바로 반영)
       publish(`/app/conversations/${convId}/read`, { lastSeenSeq: seq });
      } catch (e) {
        console.warn('markRead failed', e);
      }
    };
  }, [convId, publish]);

  // 방 변경 시 초기화
  useEffect(() => {
    lastSeenSeqRef.current = 0;
    setMyLastReadSeq(0);
    setPeerLastReadSeq(0); 
  }, [convId]);

  // acks 훅업
  useEffect(() => {
    const onAck = (e) => applyAck(e.detail);
    window.addEventListener('ws:ack', onAck);
    return () => window.removeEventListener('ws:ack', onAck);
  }, [applyAck]);

  // 메시지 처음(또는 새로 로드) 되었을 때 1회 베이스라인 설정
  useEffect(() => {
    if (!messages?.length) return;
    setPeerLastReadSeq(prev => {
      if (prev) return prev;
      const lastPeerMsg = [...messages].reverse()
        .find(m => !m._isMe && Number.isFinite(Number(m.seq)));
      return lastPeerMsg ? Number(lastPeerMsg.seq) : 0;
    });
  }, [messages]);

  useEffect(() => {
    const onMsg = (e) => {
      const m = e?.detail;
      if (!m || m.convId !== convId) return;
      if (!m._isMe) {
        setPeerInRoom(true);                  // ← presence 신호
        const s = Number(m.seq);
        if (Number.isFinite(s)) {
          setPeerLastReadSeq(prev => Math.max(prev, s));
        }
      }
    };
    window.addEventListener('ws:msg', onMsg);
    return () => window.removeEventListener('ws:msg', onMsg);
  }, [convId]);

  useEffect(() => {
    if (!messages?.length) return;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (!m._isMe) {
        const s = Number(m.seq);
        if (Number.isFinite(s)) {
          setPeerLastReadSeq(prev => Math.max(prev, s));
        }
        break;
      }
    }
  }, [messages]);

  // READ / TYPING
  useEffect(() => {
    // READ: 상대가 읽었다면 즉시 최대값으로 갱신
    personal.subscribeRead?.(convId, (ev) => {
      const s = Number(ev?.lastReadSeq ?? ev?.seq ?? ev?.last_seen_seq ?? NaN);
      const readerId = ev?.userId ?? ev?.readerId ?? ev?.reader ?? ev?.uid;
      if (!Number.isFinite(s)) return;

      if (readerId === meId) {
        if (s > (lastSeenSeqRef.current || 0)) {
          lastSeenSeqRef.current = s;
          setMyLastReadSeq(s);
        }
      } else {
        setPeerInRoom(true);                              // ← presence 신호
        setPeerLastReadSeq(prev => (s > prev ? s : prev));
      }
    });

    // TYPING: 같은 방에 있다는 강한 신호 → 현재 대화 끝까지 읽은 것으로 취급
    personal.subscribeTyping?.(convId, (ev) => {
      const isTyping = !!ev?.typing;
      if (isTyping) setPeerInRoom(true);                 // ← presence 신호
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
  }, [connected, convId, personal, meId]);

  useEffect(() => {
    if (!peerInRoom || !messages?.length) return;
    // 뒤에서부터 유효 seq 하나 찾기 (pending 방지)
    let lastValid = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const s = Number(messages[i]?.seq);
      if (Number.isFinite(s)) { lastValid = s; break; }
    }
    if (Number.isFinite(lastValid)) {
      setPeerLastReadSeq(prev => Math.max(prev, lastValid));
    }
  }, [peerInRoom, messages]);

  // 스크롤 바닥 고정
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // 1) 메시지 수신/로드 시 내 읽음 갱신 → 서버 전송 + 로컬 상태 갱신
  useEffect(() => {
    if (!messages?.length) return;
    const lastSeq = lastValidSeqOf(messages);
    reportSeenRef.current?.(lastSeq);
  }, [messages]);

  // STOMP가 연결되자마자도 마지막 유효 seq로 READ 재보고 (idempotent)
  useEffect(() => {
    if (!connected) return;
    const lastSeq = lastValidSeqOf(messages);
    reportSeenRef.current?.(lastSeq);
  }, [connected, messages]);

  // 2) 포커스/가시성 복귀 시에도 유지
  useEffect(() => {
    const sync = () => {
      const lastSeq = lastValidSeqOf(messages);
      reportSeenRef.current?.(lastSeq);
    };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') sync();
    });
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', () => {});
    };
  }, [messages]);

  useEffect(() => {
    const onRead = (e) => {
      const r = e?.detail;
      if (!r || r.convId !== convId) return;
      const s = Number(r.lastReadSeq ?? r.seq);
      if (!Number.isFinite(s)) return;
      // 상대가 읽은 값이면 즉시 반영
      if (r.userId && r.userId !== meId) {
        setPeerLastReadSeq(prev => Math.max(prev, s));
      }
    };
    window.addEventListener('ws:read', onRead);
    return () => window.removeEventListener('ws:read', onRead);
  }, [convId, meId]);

  const onSend = useCallback((t) => {
    sendMessage(t);
    // 방에 머무르는 동안은 "마지막까지 읽음" 상태를 유지
    const lastSeq = lastValidSeqOf(messages);
    reportSeenRef.current?.(lastSeq);
  }, [sendMessage, messages]);

  const onTyping = useCallback((typing) => {
    publish(`/app/conversations/${convId}/typing`, { typing });
  }, [publish, convId]);

  return (
    <section className="chat-room">
      {/* Header */}
      <header className="chat-room__header">
        <button className="chat-room__back" onClick={() => nav(-1)} aria-label="뒤로">
          ‹
        </button>
        <div className="chat-room__title">{displayName}</div>
        <div className="chat-room__more" />
      </header>

      {/* Typing indicator */}
      {peerTyping && <div className="chat-room__typing">상대가 입력 중…</div>}

      {/* Messages */}
      <div ref={listRef} className="chat-room__list">
        {hasMore && (
          <div className="center mb-16">
            <button className="btn btn--outline" onClick={loadMore}>이전 메시지 더보기</button>
          </div>
        )}

        {messages.map((m, i) => {
          const prev = i > 0 ? messages[i - 1] : null;
          const showName = !m._isMe && (!prev || prev.senderId !== m.senderId);
          return (
            <ChatMessage
              key={m.seq ?? `${m.sentAt}-${m.msgId}`}
              me={m._isMe}
              msg={m}
              name={displayName}          
              showName={showName}
              avatarUrl={!m._isMe ? profileUrl : undefined} 
              myLastReadSeq={myLastReadSeq}
              peerLastReadSeq={peerLastReadSeq}        
            />
          );
        })}
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} onTyping={onTyping} />
    </section>
  );
}
