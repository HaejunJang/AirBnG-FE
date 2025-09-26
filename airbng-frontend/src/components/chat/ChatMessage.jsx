import React, { useMemo, memo } from 'react';
import ReservationMessage from './ReservationMessage';
import ReservationCancelledMessage from './ReservationCancelledMessage';
// 부모 콜백 우선, 없으면 API fallback
import { decideReservation as decideReservationApi } from '../../api/chatApi';

function AttachmentView({ a, pending, failed }) {
  const isImage = a?.kind === 'image' || /^image\//.test(a?.mime || '');
  const url = a?.imageUrl || a?.__localUrl;
  const name = a?.fileName || '파일';

  if (isImage) {
    return (
      <div className="msg-image-wrap" data-pending={pending} data-failed={failed}>
        {url ? <img className="msg-image" src={url} alt={name} /> : <div className="msg-image--empty" />}
        {failed && <div className="msg-error">업로드 실패</div>}
      </div>
    );
  }

  return (
    <div className="msg-file" data-pending={pending} data-failed={failed}>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" download={name}>{name}</a>
      ) : (
        <span>{name}</span>
      )}
      {typeof a?.size === 'number' && <span className="msg-file__size">{Math.round(a.size/1024)} KB</span>}
      {failed && <span className="msg-error ml-8">업로드 실패</span>}
    </div>
  );
}

function ChatMessage({
  me, msg, name, showName, avatarUrl,
  peerLastReadSeq, peerInRoom, presenceSettled,
  convId, meId,
  onApproveReservation, onRejectReservation, onCancelReservation,
}) {
  // ---- 시간 포맷
  const seoulTimeFmt = useMemo(
    () => new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }),
    []
  );
  const pickMs = (m) => {
    if (Number.isFinite(m?.sentAtMs)) return m.sentAtMs;
    if (m?.sentAt) {
      const p = Date.parse(m.sentAt);
      if (Number.isFinite(p)) return p;
    }
    return Date.now();
  };
  const ms = pickMs(msg);
  let timeLabel = '';
  try { timeLabel = seoulTimeFmt.format(new Date(ms)); }
  catch { timeLabel = seoulTimeFmt.format(new Date()); }

  // ---- 읽음 배지
  const msgSeq  = Number(msg?.seq);
  const peerSeq = Number(peerLastReadSeq);
  const hasSeq = Number.isFinite(msgSeq);
  const peerHasSeq = Number.isFinite(peerSeq);
  const showUnreadBadge =
    me === true &&
    !msg?._pending &&
    presenceSettled === true &&
    !peerInRoom &&
    (hasSeq && peerHasSeq && msgSeq > peerSeq);

  const initial = (name || '상').slice(0, 1);
  const text = msg?.text ?? '';

  // ---- 취소/환불 카드 payload 통합 (신규/레거시 모두 커버)
  const cancelledPayload = useMemo(() => {
    const t = msg?.type;
    if (t === 'reservation_cancelled') {
      return {
        reservation: msg?.reservation,
        refund: msg?.refund,
        title: msg?.text || '예약이 취소되었습니다.',
      };
    }
    if (t === 'CANCELLED_WITH_REFUND' && msg?.payload) {
      return msg.payload; // 서버가 통째로 보낸 레거시 페이로드
    }
    return null;
  }, [msg]);

  // ---- 본문 렌더
  let body;
  if (cancelledPayload) {
    body = <ReservationCancelledMessage payload={cancelledPayload} />;
  } else if (msg?.type === 'reservation' && msg?.reservation) {
    const card = msg.reservation;

    const onApprove = () =>
      onApproveReservation
        ? onApproveReservation(card.reservationId)
        : decideReservationApi({ convId, reservationId: card.reservationId, approve: true }).catch(console.error);

    const onReject = (reason) =>
      onRejectReservation
        ? onRejectReservation(card.reservationId, reason)
        : decideReservationApi({ convId, reservationId: card.reservationId, approve: false, reason }).catch(console.error);

    const canAct = !!card?.canApprove && Number(meId) !== Number(msg?.senderId);
    const onCancel = () => onCancelReservation?.(card.reservationId);

    body = (
      <ReservationMessage
        me={me}
        card={card}
        canAct={canAct}
        onApprove={onApprove}
        onReject={onReject}
        onCancel={onCancel}
      />
    );
  } else if (msg?.attachments?.length) {
    body = msg.attachments.map((a, idx) => (
      <AttachmentView key={a.fileName || a.imageUrl || idx} a={a} pending={!!msg._pending} failed={!!msg.failed} />
    ));
  } else {
    body = text;
  }

  // ---- 렌더
  if (me) {
    return (
      <div className="msg-row msg-row--me" data-read={showUnreadBadge ? 'n' : 'y'}>
        <div className="msg-col">
          <div className="bubble-row">
            <div className="bubble bubble--me" data-pending={msg._pending ? 'true' : 'false'} data-failed={msg.failed ? 'true' : 'false'}>
              {body}
            </div>
            <div className="bubble-meta">
              {showUnreadBadge && <span className="msg-unread">1</span>}
              <time className="bubble-time">{timeLabel}</time>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="msg-row msg-row--you">
      <div className="msg-avatar">
        {avatarUrl ? <img src={avatarUrl} alt={name || '상대'} /> : <div className="msg-avatar__fallback">{initial}</div>}
      </div>
      <div className="msg-col">
        {showName && <div className="msg-name">{name}</div>}
        <div className="bubble-row">
          <div className="bubble bubble--you">{body}</div>
          <div className="bubble-meta">
            <time className="bubble-time">{timeLabel}</time>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ChatMessage, (prev, next) => {
  if (prev.peerLastReadSeq !== next.peerLastReadSeq) return false;
  if (prev.peerInRoom !== next.peerInRoom) return false;
  if (prev.presenceSettled !== next.presenceSettled) return false;
  if (prev.me !== next.me) return false;
  if (prev.msg !== next.msg) return false;
  const p = prev.msg || {}, n = next.msg || {};
  if ((p.seq ?? 0) !== (n.seq ?? 0)) return false;
  if (!!p._pending !== !!n._pending) return false;
  if (!!p.failed !== !!n.failed) return false;
  return true;
});
