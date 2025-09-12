import React, { useMemo } from 'react';

export default function ChatMessage({
  me,
  msg,
  name,
  showName,
  myLastReadSeq,
}) {
  const seoulTime = useMemo(
    () => new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul',
    }),
    []
  );
  const t = msg.sentAt ? new Date(msg.sentAt) : new Date();
  const timeLabel = seoulTime.format(t);

  // 안전 비교 (string/undefined 방어)
  const msgSeq = Number(msg?.seq ?? -Infinity);
  const mySeq  = Number(myLastReadSeq ?? -Infinity);

  const isUnreadForMe = !me && Number.isFinite(msgSeq) && Number.isFinite(mySeq)
    ? msgSeq > mySeq
    : false;

  const initial = (name || '상').slice(0, 1);

  if (me) {
    return (
      <div className="msg-row msg-row--me">
        <div className="msg-col">
          <div className="bubble-row">
            <time className="bubble-time">{timeLabel}</time>
            <div className="bubble bubble--me" data-pending={msg._pending ? 'true' : 'false'}>
              {msg.text ?? (msg.attachments?.length ? '[첨부 파일]' : '')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="msg-row msg-row--you">
      <div className="msg-avatar">{initial}</div>
      <div className="msg-col">
        {showName && <div className="msg-name">{name}</div>}
        <div className="bubble-row">
          <div className="bubble bubble--you">
            {msg.text ?? (msg.attachments?.length ? '[첨부 파일]' : '')}
          </div>
          <div className="bubble-meta">
            <time className="bubble-time">{timeLabel}</time>
            {isUnreadForMe && <span className="msg-unread">1</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
