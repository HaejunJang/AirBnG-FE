import React, { useMemo, memo } from 'react';
import ReservationMessage from './ReservationMessage';
import { decideReservation } from '../../api/chatApi';

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
}) {
  const seoulTimeFmt = useMemo(
    () => new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }),
    []
  );

  // const ms = typeof msg?.sentAtMs === 'number'
  //   ? msg.sentAtMs
  //   : (msg?.sentAt ? Date.parse(msg.sentAt) : Date.now());
  // const timeLabel = seoulTimeFmt.format(new Date(ms));

  // sentAtMs(숫자) > sentAt(파싱 성공) > 지금 시각 순으로 안전하게 선택
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
  try {
    timeLabel = seoulTimeFmt.format(new Date(ms));
  } catch {
    // 혹시 모를 예외 대비: 현재 시각으로 대체
    timeLabel = seoulTimeFmt.format(new Date());
  }

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

  let body;
  if (msg?.type === 'reservation' && msg?.reservation) {
    const card = msg.reservation;
    const onApprove = () => decideReservation(convId, card.reservationId, true).catch(console.error);
    const onReject  = () => decideReservation(convId, card.reservationId, false).catch(console.error);
    // 드로퍼가 카드 메시지를 보냄 → 내가 드로퍼가 아니고(canApprove=true)면 키퍼로 판단
    const canAct = !!card?.canApprove && Number(meId) !== Number(msg?.senderId);
    body = (
      <ReservationMessage
        me={me}
        card={card}
        canAct={canAct}       
        onApprove={onApprove}
        onReject={onReject}
      />
    );
  } else if (msg?.attachments?.length) {
    body = msg.attachments.map((a, idx) => (
      <AttachmentView key={a.fileName || a.imageUrl || idx} a={a} pending={!!msg._pending} failed={!!msg.failed}/>
    ));
  } else {
    body = text;
  }

  if (me) {
    return (
      <div className="msg-row msg-row--me" data-read={showUnreadBadge ? 'n' : 'y'}>
        <div className="msg-col">
          <div className="bubble-row">
            <div className="bubble bubble--me" data-pending={msg._pending ? 'true' : 'false'} data-failed={msg.failed ? 'true' : 'false'}>
              {body}
            </div>
            <div className="bubble-meta">
              <time className="bubble-time">{timeLabel}</time>
              {showUnreadBadge && <span className="msg-unread">1</span>}
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

export default memo(ChatMessage);
