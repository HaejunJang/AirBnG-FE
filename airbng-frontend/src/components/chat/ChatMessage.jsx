import React, { useMemo } from 'react';

export default function ChatMessage({
  me,
  msg,
  name,
  showName,
  myLastReadSeq,      // 내가 읽은 마지막 seq (상대 메시지 읽음 판단)
  peerLastReadSeq,    // 상대가 읽은 마지막 seq (내 메시지 읽힘 판단/필요시)
}) {
  const seoulTime = useMemo(
    () => new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul',
    }),
    []
  );
  const t = msg.sentAt ? new Date(msg.sentAt) : new Date();
  const timeLabel = seoulTime.format(t);

  // 안읽음 배지: "상대가 보낸 메시지"인데 "내가 아직 그 seq까지 못 읽었으면" 표시
  const isUnreadForMe = !me && Number.isFinite(msg.seq) && Number.isFinite(myLastReadSeq)
    ? msg.seq > myLastReadSeq
    : false;

  const initial = (name || '상').slice(0, 1);

  if (me) {
    return (
      <div className="msg-row msg-row--me">
        <div className="msg-col">
          <div
            className="bubble bubble--me"
            data-pending={msg._pending ? 'true' : 'false'}
          >
            {msg.text ?? (msg.attachments?.length ? '[첨부 파일]' : '')}
          </div>
          <div className="msg-meta msg-meta--me">
            {/* 내 메시지의 읽힘 상태를 쓰고 싶다면 여기서 peerLastReadSeq 비교해 ✓ 같은 걸 넣어도 됨 */}
            <time className="msg-time">{timeLabel}</time>
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
        <div className="bubble bubble--you">
          {msg.text ?? (msg.attachments?.length ? '[첨부 파일]' : '')}
        </div>
        <div className="msg-meta msg-meta--you">
          {isUnreadForMe && <span className="msg-unread">1</span>}
          <time className="msg-time">{timeLabel}</time>
        </div>
      </div>
    </div>
  );
}
