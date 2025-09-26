import React from "react";
import "../../styles/chat.css";

// robust 날짜 파서
function parseLocalDateTime(v) {
  if (!v) return null;
  if (typeof v === 'number') return new Date(v);
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (Array.isArray(v) && (v.length >= 3)) {
    const [y, M, d, hh = 0, mm = 0, ss = 0] = v.map(Number);
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

const formatKRW = (v) =>
  typeof v === "number"
    ? new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(v)
    : "-";

function formatPeriod(start, end) {
  const s = parseLocalDateTime(start);
  const e = parseLocalDateTime(end);
  if (!s || !e) return { date: "-", time: "-" };
  return {
    date: `${fmtDate.format(s)} ~ ${fmtDate.format(e)}`,
    time: `${fmtTime.format(s)} ~ ${fmtTime.format(e)}`
  };
}

function getRefundType(type) {
  if (type === "FULL") return "전액 환불";
  if (type === "PARTIAL") return "일부 환불";
  return "-";
}

function getRefundStatus(status) {
  if (status === "COMPLETED") return "완료";
  if (status === "PENDING") return "진행중";
  if (status === "FAILED") return "실패";
  return "-";
}

export default function ReservationCancelledMessage({ payload }) {
  if (!payload) return null;
  const { reservation, refund, title, subtitle } = payload;

  const amt     = (refund && typeof refund.amount === "number") ? refund.amount : 0;
  const rtype   = refund ? refund.refundType : "-";
  const rstatus = refund ? refund.status : "PENDING";
  const period  = formatPeriod(reservation?.startTime, reservation?.endTime);

  return (
    <div className="bubble bubble--system">
      <article className="rcancel">
        {/* 상단 라인 */}
        <header className="rcancel__head">
          <span className="rcancel__badge">예약 취소</span>
          <h4 className="rcancel__title">{title || "예약이 취소되었습니다."}</h4>
          <p className="rcancel__sub">
            {String(rstatus).toUpperCase()==="COMPLETED" ? "환불이 완료되었습니다!" : "환불이 접수되었어요."}
          </p>
        </header>

        {/* 본문: 좌측 상세, 우측 요약 */}
        <div className="rcancel__grid">
          <div className="rcancel__details">
            <div className="rcancel__row">
              <span className="rcancel__label">보관소</span>
              <span className="rcancel__val" title={reservation?.lockerName || "-"}>
                {reservation?.lockerName || "-"}
              </span>
            </div>
            <div className="rcancel__row">
              <span className="rcancel__label">기간</span>
              <span className="rcancel__val">{period.date}</span>
            </div>
            <div className="rcancel__row">
              <span className="rcancel__label">시간</span>
              <span className="rcancel__val">{period.time}</span>
            </div>
            <div className="rcancel__row">
              <span className="rcancel__label">환불 종류</span>
              <span className="rcancel__val">{getRefundType(rtype)}</span>
            </div>
          </div>

          {/* 오른쪽 요약 박스 */}
          <aside className="rcancel__summary">
            <div className="rcancel__amt">{formatKRW(amt)}</div>
            <div className={`rcancel__status is-${String(rstatus).toLowerCase()}`}>
              {getRefundStatus(rstatus)}
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}