import React, { useMemo, memo } from 'react';

function ChatMessage({
  me,
  msg,
  name,
  showName,
  avatarUrl,
  peerLastReadSeq,   // 상대가 읽은 마지막 seq
  peerInRoom,        // 상대가 방에 있으면 true
  presenceSettled,   // 존재(handshake) 확정됐는지
}) {
  const seoulTimeFmt = useMemo(
    () => new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul',
    }),
    []
  );

  const ms = typeof msg?.sentAtMs === 'number'
    ? msg.sentAtMs
    : (msg?.sentAt ? Date.parse(msg.sentAt) : Date.now());
  const timeLabel = seoulTimeFmt.format(new Date(ms));

  const msgSeq  = Number(msg?.seq);
  const peerSeq = Number(peerLastReadSeq);
  const hasSeq = Number.isFinite(msgSeq);
  const peerHasSeq = Number.isFinite(peerSeq);

  // --- 읽음 배지 ---
  //  - pending은 절대 표시 X (깜빡임 제거)
  //  - 존재(handshake) 완료 전에는 표시 보류
  //  - 둘이 같은 방(peerInRoom)이면 표시 X
  const showUnreadBadge =
    me === true &&
    !msg?._pending &&
    presenceSettled === true &&
    !peerInRoom &&
    (hasSeq && peerHasSeq && msgSeq > peerSeq);

  const initial = (name || '상').slice(0, 1);
  const text = msg?.text ?? (msg?.attachments?.length ? '[첨부 파일]' : '');

  if (me) {
    return (
      <div className="msg-row msg-row--me" data-read={showUnreadBadge ? 'n' : 'y'}>
        <div className="msg-col">
          <div className="bubble-row">
            <div className="bubble bubble--me" data-pending={msg._pending ? 'true' : 'false'}>
              {text}
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
          <div className="bubble bubble--you">{text}</div>
          <div className="bubble-meta">
            <time className="bubble-time">{timeLabel}</time>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ChatMessage);
