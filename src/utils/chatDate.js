// 타임존 보정용: Asia/Seoul 기준으로 날짜키/라벨 생성
const TZ = 'Asia/Seoul';

function ymdKey(ms, tz = TZ) {
  const d = new Date(ms);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const obj = {};
  parts.forEach(({ type, value }) => {
    obj[type] = value;
  });

  // 예: 2025-05-29
  return `${obj.year}-${obj.month}-${obj.day}`;
}

export function dateLabel(ms, tz = TZ) {
  // "2025. 05. 29. 목요일"
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  }).format(new Date(ms));
}

/**
 * 메시지 배열을 날짜칩(divider) + 메시지로 장식한 배열로 변환
 * @param {Array<{sentAtMs?: number|null}>} messages
 * @param {string} tz
 * @returns {Array}
 */
export function decorateWithDividers(messages, tz = TZ) {
  const out = [];
  let lastKey = null;

  for (const m of messages) {
    const ms = typeof m.sentAtMs === 'number' ? m.sentAtMs : Date.now();
    const key = ymdKey(ms, tz);

    if (key !== lastKey) {
      out.push({ kind: 'divider', key, label: dateLabel(ms, tz) });
      lastKey = key;
    }

    out.push({ kind: 'message', ...m });
  }

  return out;
}