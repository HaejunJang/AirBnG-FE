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
  const lastSeenSeqRef = useRef(0);
  const [myLastReadSeq, setMyLastReadSeq] = useState(0);
  const [peerLastReadSeq, setPeerLastReadSeq] = useState(0);
  const [peerInRoom, setPeerInRoom] = useState(false);
  const reportSeenRef = useRef(null);

  const { connected, publish } = useStomp();
  const { messages, sendMessage, loadMore, hasMore, applyAck } =
    useChatRoom(convId, meId);

  const nav = useNavigate();
  const { displayName, profileUrl } = usePeer(convId);
  const personal = usePersonalQueues({ onError: (err) => console.error('WS ERROR', err) });

  // sentAt → sentAtMs 정규화
  const normalizeMs = (x) =>
    typeof x?.sentAtMs === 'number'
      ? x.sentAtMs
      : (x?.sentAt ? Date.parse(x.sentAt) : undefined);

  // 토픽/ACK를 업서트용 패치로 변환
  const toAckPatch = (m) => ({
    msgId: m?.msgId,
    seq: m?.seq,
    sentAtMs: normalizeMs(m),
  });

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

  // 방 전환 시 초기화
  useEffect(() => {
    lastSeenSeqRef.current = 0;
    setMyLastReadSeq(0);
    setPeerLastReadSeq(0);
  }, [convId]);

  // WS: ACK → 업서트
  useEffect(() => {
    const onAck = (e) => {
      const patch = toAckPatch(e.detail || {});
      if (!patch.msgId) return;
      applyAck(patch);
    };
    window.addEventListener('ws:ack', onAck);
    return () => window.removeEventListener('ws:ack', onAck);
  }, [applyAck]);

  // WS: MSG → 내 펜딩과 동기화 + 상대 최신 seq 추적
  useEffect(() => {
    const onMsg = (e) => {
      const m = e?.detail;
      if (!m || m.convId !== convId) return;

      const patch = toAckPatch(m);
      if (patch.msgId) applyAck(patch);

      if (!m._isMe) {
        setPeerInRoom(true);
        const s = Number(m.seq);
        if (Number.isFinite(s)) setPeerLastReadSeq((prev) => Math.max(prev, s));
      }
    };
    window.addEventListener('ws:msg', onMsg);
    return () => window.removeEventListener('ws:msg', onMsg);
  }, [convId, applyAck]);

  // 초기 messages로 상대 읽음 베이스라인
  useEffect(() => {
    if (!messages?.length) return;
    setPeerLastReadSeq((prev) => {
      if (prev) return prev;
      const lastPeerMsg = [...messages].reverse()
        .find((m) => !m._isMe && Number.isFinite(Number(m.seq)));
      return lastPeerMsg ? Number(lastPeerMsg.seq) : 0;
    });
  }, [messages]);

  // READ / TYPING
  useEffect(() => {
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
        setPeerInRoom(true);
        setPeerLastReadSeq((prev) => (s > prev ? s : prev));
      }
    });

    personal.subscribeTyping?.(convId, (ev) => {
      const isTyping = !!ev?.typing;
      if (isTyping) setPeerInRoom(true);
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

  // 같은 방에 있으면 상대는 최신까지 읽은 것으로 추정
  useEffect(() => {
    if (!peerInRoom || !messages?.length) return;
    let lastValid = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const s = Number(messages[i]?.seq);
      if (Number.isFinite(s)) { lastValid = s; break; }
    }
    if (Number.isFinite(lastValid)) {
      setPeerLastReadSeq((prev) => Math.max(prev, lastValid));
    }
  }, [peerInRoom, messages]);

  // 스크롤 바닥 고정
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

  // 연결 직후에도 한번 동기화
  useEffect(() => {
    if (!connected) return;
    const lastSeq = lastValidSeqOf(messages);
    reportSeenRef.current?.(lastSeq);
  }, [connected, messages]);

  // 포커스/가시성 복귀 시 동기화
  useEffect(() => {
    const sync = () => {
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
  }, [messages]);

  // 전송
  const onSend = useCallback((text) => {
    sendMessage(text); // useChatRoom에서 로컬 펜딩 + 서버 전송
    const lastSeq = lastValidSeqOf(messages);
    reportSeenRef.current?.(lastSeq);
  }, [sendMessage, messages]);

  const onTyping = useCallback((typing) => {
    publish(`/app/conversations/${convId}/typing`, { typing });
  }, [publish, convId]);

  return (
    <section className="chat-room">
      <header className="chat-room__header">
        <button className="chat-room__back" onClick={() => nav(-1)} aria-label="뒤로">‹</button>
        <div className="chat-room__title">{displayName}</div>
        <div className="chat-room__more" />
      </header>

      {peerTyping && <div className="chat-room__typing">상대가 입력 중…</div>}

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
              key={m.msgId}                 // msgId 고정
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

      <ChatInput onSend={onSend} onTyping={onTyping} />
    </section>
  );
}
