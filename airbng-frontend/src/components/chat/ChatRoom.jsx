import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChatRoom from '../../hooks/useChatRoom';
import useStomp from '../../hooks/useStomp';
import usePersonalQueues from '../../hooks/usePersonalQueues';

export default function ChatRoom({ convId, meId }) {
  const listRef = useRef(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const { publish } = useStomp();

  const { messages, sendMessage, loadMore, hasMore, markAllAsRead } = useChatRoom(convId, meId);

  // 개인 큐(ACK/ERROR) 구독 (필요시 UI 반영)
  usePersonalQueues({
    onAck: (ack) => {
      // { msgId, seq, sentAt } — 필요하면 전송 상태 업데이트
      // console.log('ACK', ack);
    },
    onError: (err) => {
      console.error('WS ERROR', err);
      // 필요시 토스트/알럿
    },
  });

  // 방별 개인 큐: READ/ TYPING
  const { subscribeRead, unsubscribeRead, subscribeTyping, unsubscribeTyping } = useMemo(() => {
    return require('../../hooks/usePersonalQueues').default.prototype ?? {};
  }, []); // (주의) 위 한 줄은 타입 가드용. 실제로는 ChatRoomPage에서 훅을 생성해 내려주는 편이 더 깔끔.
  // ↑ 간단히 하려면 아래처럼 직접 훅 생성해서 사용:
  const { connected } = useStomp();
  const personal = usePersonalQueues();

  useEffect(() => {
    if (!connected) return;
    // 상대 읽음 이벤트
    personal.subscribeRead?.(convId, (lastSeenSeq) => {
      // 필요하면 메시지 리스트의 '읽음' 표시 갱신
      console.log('PEER READ', lastSeenSeq);
    });
    // 상대 타이핑 이벤트
    personal.subscribeTyping?.(convId, (ev) => {
      setPeerTyping(!!ev?.typing);
    });
    return () => {
      personal.unsubscribeRead?.(convId);
      personal.unsubscribeTyping?.(convId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, convId]);

  // 새 메시지 오면 바닥으로 스크롤
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const onSend = useCallback((t) => {
    sendMessage(t);
    // 전송 직후 내 화면 기준 읽음 처리(옵션)
    markAllAsRead();
  }, [sendMessage, markAllAsRead]);

  const onTyping = useCallback((typing) => {
    // /app/conversations/{convId}/typing
    publish(`/app/conversations/${convId}/typing`, { typing });
  }, [publish, convId]);

  return (
    <div className="d-flex flex-column" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="d-flex justify-content-center align-items-center p-2 border-bottom gap-2">
        {hasMore && (
          <button className="btn btn-sm btn-outline-secondary" onClick={loadMore}>
            이전 메시지 더보기
          </button>
        )}
        {peerTyping && <span className="text-muted" style={{ fontSize: 12 }}>상대가 입력 중…</span>}
      </div>

      <div ref={listRef} className="flex-grow-1 overflow-auto p-2">
        {messages.map((m) => (
          <ChatMessage key={m.seq ?? `${m.sentAt}-${m.senderId}`} me={m._isMe} msg={m} />
        ))}
      </div>

      <ChatInput onSend={onSend} onTyping={onTyping} />
    </div>
  );
}
