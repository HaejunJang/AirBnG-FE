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
  const lastSeenSeqRef = useRef(0);   // 마지막으로 읽음 서버에 보낸 seq 기억

  const { connected, publish } = useStomp();
  const { messages, sendMessage, loadMore, hasMore, markAllAsRead, applyAck } =
    useChatRoom(convId, meId);

  // 헤더 타이틀 (ChatList에서 state로 넘겨줌)
  const { state } = useLocation();
  const title = state?.peerName || '상대';
  const nav = useNavigate();

  // acks는 전역 브릿지에서 받음(중복 방지). 여기선 read/typing만 쓰자.
  const personal = usePersonalQueues({
    onError: (err) => console.error('WS ERROR', err),
  });

  useEffect(() => {
    lastSeenSeqRef.current = 0;   // 방 변경 시 초기화
  }, [convId]);

  // 전역 브릿지가 쏘는 ws:ack → useChatRoom.applyAck에 연결 (한 줄 훅업)
  useEffect(() => {
    const onAck = (e) => applyAck(e.detail);
    window.addEventListener('ws:ack', onAck);
    return () => window.removeEventListener('ws:ack', onAck);
  }, [applyAck]);

  // READ / TYPING
  useEffect(() => {
    if (!connected) return;
    personal.subscribeRead?.(convId, () => {});
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

  // 1) 방 입장 후, 메시지를 받아오면 곧바로 읽음 처리
 useEffect(() => {
    if (!connected || !messages?.length) return;           // 연결 가드
    const last = messages[messages.length - 1];
    const lastSeq = last?.seq;
    if (lastSeq && lastSeq > (lastSeenSeqRef.current || 0)) {
      lastSeenSeqRef.current = lastSeq;
      markAllAsRead();
    }
  }, [messages, markAllAsRead, connected]);

 // 2) 창을 다시 보고 있을 때도 읽음 유지 (앱 전환/탭 복귀)
 useEffect(() => {
   const onFocus = () => markAllAsRead();
   const onVis = () => { if (document.visibilityState === 'visible') markAllAsRead(); };
   window.addEventListener('focus', onFocus);
   document.addEventListener('visibilitychange', onVis);
   return () => {
     window.removeEventListener('focus', onFocus);
     document.removeEventListener('visibilitychange', onVis);
   };
 }, [markAllAsRead]);

  const onSend = useCallback((t) => {
    sendMessage(t);
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
          const prev = i > 0 ? messages[i-1] : null;
          const showName = !m._isMe && (!prev || prev.senderId !== m.senderId);
          return (
            <ChatMessage
              key={m.seq ?? `${m.sentAt}-${m.msgId}`}
              me={m._isMe}
              msg={m}
              name={state?.peerName || '상대'}
              showName={showName}
            />
          );
        })}
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} onTyping={onTyping} />
    </section>
  );
}
