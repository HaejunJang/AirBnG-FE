import React, { memo, useMemo, useState, useEffect } from 'react';
import RejectReasonModal from './RejectReasonModal';

function parseLocalDateTime(v) {
  if (!v) return null;
  if (typeof v === 'number') return new Date(v);
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

  // 배열([y, M, d, hh, mm, ss, nano]) 케이스 흡수
  if (Array.isArray(v) && (v.length >= 3)) {
    const [y, M, d, hh = 0, mm = 0, ss = 0] = v.map(Number);
    // JS Date의 month는 0-based
    return new Date(y, (M - 1), d, hh, mm, ss);
  }

  const s = String(v).trim();
  const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,9}))?$/);
  if (m1) {
    let [_, y, M, d, hh, mm, ss] = m1;
    return new Date(+y, +M - 1, +d, +hh, +mm, +(ss || 0));
  }
  const t = Date.parse(s.replace(' ', 'T'));
  return Number.isNaN(t) ? null : new Date(t);
}

const fmtDate = new Intl.DateTimeFormat('ko-KR', {
  year: '2-digit', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul',
});
const fmtTime = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul',
});

export default memo(function ReservationMessage({ me, card, canAct, onApprove, onReject }) {
  const [acted, setActed] = useState(false);
  const [pending, setPending] = useState(false);
  const [openReject, setOpenReject] = useState(false);

  const isDone = /^(confirmed|rejected|completed|cancelled)$/i.test(card?.status || '');
  useEffect(() => { if (isDone) setActed(true); }, [isDone]);

  // 다양한 키 지원
  const rawStart = card?.startTime ?? card?.start_at ?? card?.start ?? card?.from;
  const rawEnd   = card?.endTime   ?? card?.end_at   ?? card?.end   ?? card?.to;

  const start = useMemo(() => parseLocalDateTime(rawStart), [rawStart]);
  const end   = useMemo(() => parseLocalDateTime(rawEnd),   [rawEnd]);

  // 항상 그려지는 라벨
  const dateLabel = `${start ? fmtDate.format(start) : '-'} ~ ${end ? fmtDate.format(end) : '-'}`;
  const timeLabel = `${start ? fmtTime.format(start) : '-'} ~ ${end ? fmtTime.format(end) : '-'}`;

  // 종류: category 없으면 jimTypeCounts로 생성
  const categoryLabel = useMemo(() => {
    if (card?.category) return card.category;
    const map = { 1: '백팩/가방', 2: '소형 캐리어', 3: '대형 캐리어' }; // 필요시 확장
    if (Array.isArray(card?.jimTypeCounts) && card.jimTypeCounts.length) {
      return card.jimTypeCounts
        .map(({ jimTypeId, count }) =>
          `${map[jimTypeId] ?? `타입${jimTypeId}`}${count > 1 ? `×${count}` : ''}`)
        .join(', ');
    }
    return '-';
  }, [card]);

  const pickupLabel = card?.pickupMemo ?? card?.pickup_note ?? card?.pickup ?? '-';

  const isCancelled = /(CANCELLED|CANCEL|canceled|취소)/i.test(String(card?.status));
  console.log('isCancelled:', isCancelled, 'card.status:', card?.status);
  const showActions = canAct && card?.canApprove && !acted && !isCancelled;
  
  console.log('card.status:', card?.status);
  const handleApprove = async () => {
    if (pending) return;
    setPending(true); setActed(true);
    try { await onApprove?.(); } catch { setActed(false); } finally { setPending(false); }
  };

  const handleRejectClick = () => setOpenReject(true);

  const submitReject = async (reason) => {
    setOpenReject(false);
    if (pending) return;
    setPending(true);
    setActed(true); 
    try { await onReject?.(reason); } catch { setActed(false); } finally { setPending(false); }
  };

  return (
    <div className="reservation-card reservation-card--compact">
      <div className="rc__media">
        {card?.imgUrl && <img className="rc__thumb rc__thumb--sm" src={card.imgUrl} alt="locker" />}
        <div className="rc__meta">
          <div className="rc__title">{card?.lockerName || '예약'}</div>
          <div className="rc__addr">{card?.address || '-'}</div>
        </div>
      </div>

      <section className="rc__details">
        <div className="rc__row"><span className="rc__label">날짜</span><span className="rc__val">{dateLabel}</span></div>
        <div className="rc__row"><span className="rc__label">시간</span><span className="rc__val">{timeLabel}</span></div>
        <div className="rc__row"><span className="rc__label">종류</span><span className="rc__val">{categoryLabel}</span></div>
        <div className="rc__row"><span className="rc__label">픽업</span><span className="rc__val">{pickupLabel}</span></div>
      </section>

      {showActions && !acted && (
        <div className="rc__actions">
          <button className="btn btn--outline" onClick={handleRejectClick} disabled={pending}>거절</button>
          <button className="btn btn--primary" onClick={handleApprove} disabled={pending}>승인</button>
        </div>
      )}
      <RejectReasonModal
        open={openReject}
        onClose={() => setOpenReject(false)}
        onSubmit={submitReject}
      />
    </div>
  );
});
