import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChatRoom from '../../hooks/useChatRoom';
import useStomp from '../../hooks/useStomp';
import usePersonalQueues from '../../hooks/usePersonalQueues';
import usePeer from '../../hooks/usePeer';
import { markRead as markReadApi, uploadAttachment } from '../../api/chatApi'; // ← 추가
import { decorateWithDividers } from '../../utils/chatDate';
import '../../styles/chat.css';

const PEER_ACTIVE_WINDOW_MS = 8000;
const PRESENCE_PING_MS = 20000;
const RELOAD_FLAG = 'chat:reloading';
const PRESENCE_GRACE_MS = 600;

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
  const { messages, sendMessage, loadMore, hasMore, applyAck, pushLocal } =
    useChatRoom(convId, meId, { ready: connected }); // ← pushLocal 사용

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
    setPresenceSettled(true);
    clearTimeout(peerDecayTimerRef.current);
    peerDecayTimerRef.current = setTimeout(() => {
      if (Date.now() - peerActiveAtRef.current >= PEER_ACTIVE_WINDOW_MS) setPeerInRoom(false);
    }, PEER_ACTIVE_WINDOW_MS + 50);

    setPeerLastReadSeq(prev => {
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
  }, [messages]);

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

  // 최근 수신이 상대면 presence
  useEffect(() => {
    if (!messages?.length) return;
    const m = messages[messages.length - 1];
    if (m && Number(m.senderId) !== Number(meId)) pokePeerInRoom();
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
      pokePeerInRoom();
      const isTyping = !!ev?.typing;
      setPeerTyping(isTyping);
      clearTimeout(typingClearRef.current);
      if (isTyping) typingClearRef.current = setTimeout(() => setPeerTyping(false), 2000);
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

  // 연결 직후
  useEffect(() => {
    if (!connected) return;

    const ping = () => publish(`/app/conversations/${convId}/typing`, { typing: false });
    ping();

    const doSync = () => {
      const lastSeq = lastValidSeqOf(messages);
      reportSeenRef.current?.(lastSeq);
    };
    doSync();
    const syncTimer = setTimeout(doSync, 200);

    try {
      if (sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.removeItem(RELOAD_FLAG);
        setPresenceSettled(true);
      }
    } catch {}

    const grace = setTimeout(() => setPresenceSettled(true), PRESENCE_GRACE_MS);
    const keep = setInterval(ping, PRESENCE_PING_MS);

    return () => { clearInterval(keep); clearTimeout(syncTimer); clearTimeout(grace); };
  }, [connected, convId, publish, messages]);

  const onSend = useCallback((text) => {
    sendMessage(text);
    publish(`/app/conversations/${convId}/typing`, { typing: false });
    const lastSeq = lastValidSeqOf(messages);
    reportSeenRef.current?.(lastSeq);
  }, [sendMessage, messages, publish, convId]);

  const onTyping = useCallback((typing) => {
    publish(`/app/conversations/${convId}/typing`, { typing });
  }, [publish, convId]);

  // ===== 첨부 업로드(낙관적 → 서버 교체) =====
  const onAttach = useCallback(async (files) => {
    for (const file of files) {
      const isImage = /^image\//.test(file.type) || /\.(png|jpg|jpeg|gif|webp)$/i.test(file.name);
      const kind = isImage ? 'image' : 'file';
      const msgId = uuid();

      // 1) 낙관적 메시지
      const localUrl = isImage ? URL.createObjectURL(file) : undefined;
      pushLocal({
        convId, msgId,
        senderId: meId, senderName: 'me',
        type: kind,
        attachments: [{
          attachmentId: `local-${msgId}`,
          kind, mime: file.type, size: file.size,
          imageUrl: localUrl, fileName: file.name,
        }],
        text: null,
        _pending: true,
        sentAtMs: Date.now(),
      });

      // 2) 업로드
      try {
        await uploadAttachment(convId, file, { kind, msgId });
        // 성공 시 서버 브로드캐스트로 정식 메시지가 들어오며 기존 낙관적이 교체됨(applyAck 로직)
      } catch (e) {
        console.error('upload failed', e);
        applyAck({ msgId, failed: true }); // UI에 실패 표시
      }
    }
  }, [convId, meId, pushLocal, applyAck]);

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

        {useMemo(() => decorateWithDividers(messages), [messages]).map((it, i, arr) => {
          if (it.kind === 'divider') {
            return (
              <div key={`d-${it.key}-${i}`} className="date-chip">
                <span>{it.label}</span>
              </div>
            );
          }
          const m = it; // kind: 'message'
          // 직전 'message'만 찾아서 이름 표시 여부 계산
          let prevMsg = null;
          for (let j = i - 1; j >= 0; j--) {
            if (arr[j] && arr[j].kind === 'message') { prevMsg = arr[j]; break; }
          }
          const showName =
            Number(m.senderId) !== Number(meId) &&
            (!prevMsg || prevMsg.senderId !== m.senderId);
          const isMine = Number(m.senderId) === Number(meId);

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
              convId={convId}
              meId={meId}
            />
          );
        })}
      </div>

      <ChatInput onSend={onSend} onTyping={onTyping} onAttach={onAttach} />
    </section>
  );
}
