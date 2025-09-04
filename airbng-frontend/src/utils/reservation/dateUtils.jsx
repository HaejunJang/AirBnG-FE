// 날짜 포맷팅 함수들
export const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '날짜 정보 없음';
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${year}-${month}-${day} (${weekday})`;
};

export const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '시간 정보 없음';
    const M = date.getMonth() + 1;
    const D = date.getDate();
    const H = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const wd = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${M}.${D} (${wd}) ${H}:${m}`;
};

export const formatDuration = (hours) => {
    const mins = Math.round((+hours || 0) * 60);
    const d = Math.floor(mins / 1440);
    const h = Math.floor((mins % 1440) / 60);
    const m = mins % 60;
    return `${d > 0 ? d + '일 ' : ''}${h > 0 ? h + '시간 ' : ''}${m > 0 ? m + '분' : ''}`.trim() || '0분';
};