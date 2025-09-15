import React, { useMemo, memo } from 'react';

function ChatMessage({
  me,
  msg,
  name,
  showName,
  avatarUrl,
  peerLastReadSeq,   // 상대가 읽은 마지막 seq (내 말풍선의 1 판단에만 사용)
}) {
  const seoulTimeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Seoul',
      }),
    []
  );

  const t = msg?.sentAt ? new Date(msg.sentAt) : new Date();
  const timeLabel = seoulTimeFmt.format(t);

  // 안전한 숫자 변환
  const msgSeq  = Number(msg?.seq);
  const peerSeq = Number(peerLastReadSeq);

  const hasSeq       = Number.isFinite(msgSeq);
  const peerHasSeq   = Number.isFinite(peerSeq);

  // --- 읽음 배지 로직 ---
  // 내 메시지(me=true) 인 경우만 표시:
  //  - 아직 ACK 전(pending)이면 먼저 1을 띄워준다
  //  - ACK 이후에는 seq 비교(내 seq > peerLastReadSeq)일 때만 1
  const showUnreadBadge =
    !!me && (!hasSeq || (peerHasSeq && msgSeq > peerSeq));

  const initial = (name || '상').slice(0, 1);
  const text = msg?.text ?? (msg?.attachments?.length ? '[첨부 파일]' : '');

  if (me) {
    return (
      <div className="msg-row msg-row--me" data-read={showUnreadBadge ? 'n' : 'y'}>
        <div className="msg-col">
          <div className="bubble-row">
            <div
              className="bubble bubble--me"
              data-pending={msg._pending ? 'true' : 'false'}
            >
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

  // 상대 메시지: 1은 절대 표시하지 않음 (카톡 규칙)
  return (
    <div className="msg-row msg-row--you">
      <div className="msg-avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name || '상대'} />
        ) : (
          <div className="msg-avatar__fallback">{initial}</div>
        )}
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
