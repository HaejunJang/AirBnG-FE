import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChatRoom from '../../hooks/useChatRoom';
import useStomp from '../../hooks/useStomp';
import usePersonalQueues from '../../hooks/usePersonalQueues';
import '../../styles/chat.css';

export default function ChatRoom({ convId, meId }) {
  const listRef = useRef(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingClearRef = useRef(null);
  const lastSeenSeqRef = useRef(0);           // 서버에 보낸 내 마지막 읽음 seq 기억
  const [myLastReadSeq, setMyLastReadSeq] = useState(0); // NEW: 렌더링용 로컬 상태

  const { connected, publish } = useStomp();
  const { messages, sendMessage, loadMore, hasMore, markAllAsRead, applyAck } =
    useChatRoom(convId, meId);

  const { state } = useLocation();
  const title = state?.peerName || '상대';
  const nav = useNavigate();

  const personal = usePersonalQueues({
    onError: (err) => console.error('WS ERROR', err),
  });

  // 방 변경 시 초기화
  useEffect(() => {
    lastSeenSeqRef.current = 0;
    setMyLastReadSeq(0); // NEW
  }, [convId]);

  // acks 훅업
  useEffect(() => {
    const onAck = (e) => applyAck(e.detail);
    window.addEventListener('ws:ack', onAck);
    return () => window.removeEventListener('ws:ack', onAck);
  }, [applyAck]);

  // READ / TYPING
  useEffect(() => {
    if (!connected) return;
    personal.subscribeRead?.(convId, (ev) => {
      const s = Number(ev?.lastReadSeq ?? ev?.seq ?? 0);
      if (Number.isFinite(s) && s > (lastSeenSeqRef.current || 0)) {
        lastSeenSeqRef.current = s;
        setMyLastReadSeq(s);
      }
    });

    personal.subscribeTyping?.(convId, (ev) => {
      const isTyping = !!ev?.typing;
      if (isTyping) {
        setPeerTyping(true);
        clearTimeout(typingClearRef.current);
        typingClearRef.current = setTimeout(() => setPeerTyping(false), 2000);
      } else {
        setPeerTyping(false);
        clearTimeout(typingClearRef.current);
      }
    });
    
    return () => {
      personal.unsubscribeRead?.(convId);
      personal.unsubscribeTyping?.(convId);
      clearTimeout(typingClearRef.current);
    };
  }, [connected, convId, personal]);

  // 스크롤 바닥 고정
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // 1) 메시지 수신/로드 시 내 읽음 갱신 → 서버 전송 + 로컬 상태 갱신
  useEffect(() => {
    if (!connected || !messages?.length) return;
    const last = messages[messages.length - 1];
    const lastSeq = Number(last?.seq ?? 0);
    if (Number.isFinite(lastSeq) && lastSeq > (lastSeenSeqRef.current || 0)) {
      lastSeenSeqRef.current = lastSeq;
      setMyLastReadSeq(lastSeq);   // 로컬 즉시 반영
      markAllAsRead();             // 서버 보고 (ACK 오면 위 subscribeRead도 동작)
    }
  }, [messages, markAllAsRead, connected]);

  // 2) 포커스/가시성 복귀 시에도 유지
  useEffect(() => {
    const sync = () => {
      setMyLastReadSeq(lastSeenSeqRef.current || 0);
      markAllAsRead();
    };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') sync();
    });
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', () => {});
    };
  }, [markAllAsRead]);

  const onSend = useCallback((t) => {
    sendMessage(t);
    setMyLastReadSeq(lastSeenSeqRef.current || 0); // 보낸 직후도 최신으로
    markAllAsRead();
  }, [sendMessage, markAllAsRead]);

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
        <div className="chat-room__title">{title}</div>
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
              name={state?.peerName || '상대'}
              showName={showName}
              myLastReadSeq={myLastReadSeq}   // NEW: 전달!
              // peerLastReadSeq={...}         // 필요하면 여기서도 전달 가능
            />
          );
        })}
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} onTyping={onTyping} />
    </section>
  );
}
