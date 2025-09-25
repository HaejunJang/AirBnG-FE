import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChatRoom from '../../hooks/useChatRoom';
import useStomp from '../../hooks/useStomp';
import usePersonalQueues from '../../hooks/usePersonalQueues';
import usePeer from '../../hooks/usePeer';
import { decideReservation } from '../../api/chatApi';
import { markRead as markReadApi, uploadAttachment } from '../../api/chatApi';
import { cancelReservationApi } from '../../api/reservationApi';
import { decorateWithDividers } from '../../utils/chatDate';
import '../../styles/chat.css';
import arrowLeft from '../../assets/arrow-left.svg';

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

  const { connected, publish, client } = useStomp();
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
        console.log('[READ SEND]', { convId, seq });
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
    try {
      const cacheKey = `peerRead:${convId}`;
      const cached = Number(sessionStorage.getItem(cacheKey) || 0);
      setPeerLastReadSeq(Number.isFinite(cached) ? cached : 0);
    } catch { setPeerLastReadSeq(0); }
    setPeerInRoom(false);
    setPresenceSettled(false);
    clearTimeout(peerDecayTimerRef.current);
  }, [convId]);

  useEffect(() => {
    // 현재 열린 방 브로드캐스트
    try {
      window.dispatchEvent(new CustomEvent('chat:open', { detail: { convId } }));
    } catch {}
    return () => {
      try { window.dispatchEvent(new Event('chat:close')); } catch {}
    };
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
      console.log('[READ EVT]', { convId, ev, meId });
      const s = Number(
        (typeof ev === 'number') ? ev : (ev?.lastReadSeq ?? ev?.seq ?? ev?.last_seen_seq)
      );
      const readerId = ev?.userId ?? ev?.readerId ?? ev?.reader ?? ev?.uid;
      if (!Number.isFinite(s)) return;

      if (Number(readerId) === Number(meId)) {
        if (s > (lastSeenSeqRef.current || 0)) {
          lastSeenSeqRef.current = s;
          setMyLastReadSeq(s);
        }
      } else {
        console.log('[PEER READ]', { convId, readerId, s });
        pokePeerInRoom();
        setPeerLastReadSeq(prev => {
          const next = s > prev ? s : prev;
          try { sessionStorage.setItem(`peerRead:${convId}`, String(next)); } catch {}
          return next;
        });
      }
    });

    personal.subscribeTyping?.(convId, (ev) => {
      console.log('[TYPING EVT]', { convId, ev });
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
    console.log('[BUMP PEER READ TO LAST]', { convId, lastSeq });
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

  // 연결 직후 (구독이 잡힌 다음 살짝 딜레이 후 sync 전송)
  useEffect(() => {
    if (!connected) return;
    const sendSync = () => {
      publish(`/app/conversations/${convId}/read-sync`, {});
      publish(`/app/conversations/${convId}/typing`, { typing: false });
    };
    const afterSub = setTimeout(sendSync, 200); 

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
    const keep = setInterval(() => publish(`/app/conversations/${convId}/typing`, { typing: false }), PRESENCE_PING_MS);

    return () => { clearInterval(keep); clearTimeout(syncTimer); clearTimeout(grace); clearTimeout(afterSub); };
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

  // ====== 예약 승인/거절 핸들러 ======
  const approveReservation = useCallback(async (reservationId) => {
    await decideReservation({ convId, reservationId, approve: true });
    // 서버가 시스템 메시지 브로드캐스트 해주므로 추가 전송 불필요
  }, [convId]);

  const rejectReservation = useCallback(async (reservationId, reason) => {
    await decideReservation({ convId, reservationId, approve: false, reason });
  }, [convId]);

  // ====== 예약 취소 핸들러(옵션 A: 기존 consumer API 바로 호출) ======
  const cancelReservation = useCallback(async (reservationId) => {
    try {
      await cancelReservationApi(reservationId, meId);
      // 성공 시 서버가 ReservationCancelledEvent → 채팅카드 push 하므로 추가 동작 불필요
    } catch (e) {
      console.error('cancelReservation failed', e);
      // 필요 시 토스트 처리
    }
  }, [meId]);

  // ====== 카드 구독: /user/queue/chat.cards ======
  useEffect(() => {
    if (!client || !connected) return;

    const onPersonal = (frame) => {
      try {
        const payload = JSON.parse(frame.body);
        pushLocal({
          convId,
          msgId: `card-${payload?.reservation?.reservationId}-${Date.now()}`,
          senderId: 0,
          senderName: 'system',
          type: 'CANCELLED_WITH_REFUND',
          payload,
          sentAtMs: Date.now(),
        });
      } catch (e) { console.error('card payload parse error', e); }
    };

  const onTopic = (frame) => {
    try {
      const payload = JSON.parse(frame.body); // CancelledWithRefundCardDto
      // convId가 payload에 함께 오니 신뢰해서 사용(혹은 현재 convId 비교)
      const cid = payload?.convId || convId;
      pushLocal({
        convId: cid,
        msgId: `card-${payload?.reservation?.reservationId}-${Date.now()}`,
        senderId: 0,
        senderName: 'system',
        type: 'CANCELLED_WITH_REFUND',
        payload,
        sentAtMs: Date.now(),
      });
    } catch (e) { console.error('topic card payload parse error', e); }
  };

    const subs = [];
    // 개인 큐: 이미 열려있는 화면에 즉시
    subs.push(client.subscribe('/user/queue/chat.cards', onPersonal));
    // 대화 토픽: 백엔드가 /topic/conversations/{convId}/cards 로 쏘고 있음
    subs.push(client.subscribe(`/topic/conversations/${convId}/cards`, onTopic));

    return () => { subs.forEach(s => { try { s?.unsubscribe(); } catch {} }); };
  }, [client, connected, convId, pushLocal]);

  return (
    <section className="chat-room">
      <header className="chat-room__header">
        <button className="chat-room__back" onClick={() => nav(-1)} aria-label="뒤로">
          <img src={arrowLeft} alt="뒤로" />
        </button>
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
              // key={m.msgId}
              key={isMine ? `${m.msgId}-${peerLastReadSeq}-${peerInRoom?1:0}` : m.msgId}
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
              onApproveReservation={(reservationId) => approveReservation(reservationId)}
              onRejectReservation={(reservationId, reason) => rejectReservation(reservationId, reason)}
              onCancelReservation={(reservationId) => cancelReservation(reservationId)}
            />
          );
        })}
      </div>

      <ChatInput onSend={onSend} onTyping={onTyping} onAttach={onAttach} />
    </section>
  );
}
