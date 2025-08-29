import React from 'react';

// 기간 옵션 상수
export const PERIOD_OPTIONS = [
    { value: 'ALL', label: '전체' },
    { value: '1W', label: '최근 1주일' },
    { value: '3M', label: '최근 3개월' },
    { value: '6M', label: '최근 6개월' },
    { value: '1Y', label: '최근 1년' },
    { value: '2Y', label: '최근 2년' }
];

// 상태 텍스트 반환
export const getStatusText = (state) => {
    const statusMap = {
        CONFIRMED: { text: '예약완료', class: 'confirmed' },
        PENDING: { text: '예약대기', class: 'pending' },
        CANCELLED: { text: '취소완료', class: 'cancelled' },
        COMPLETED: { text: '이용완료', class: 'completed' }
    };
    const s = statusMap[state] || { text: state, class: 'pending' };
    return <span className={`status-text ${s.class}`}>{s.text}</span>;
};

// 예약 상세 페이지 이동
export const goToReservationDetail = (contextPath, reservationId, role) => {
    if (role === 'KEEPER') {
        window.location.href = `${contextPath}/page/reservations/confirm?reservationId=${reservationId}`;
    } else {
        window.location.href = `${contextPath}/page/reservations?id=${reservationId}`;
    }
};

// 다시 예약
export const reBooking = (contextPath, lockerId) => {
    window.location.href = `${contextPath}/lockers/${lockerId}/reservation`;
};

// 짐 타입 텍스트 생성
export const getJimTypesText = (jimTypeResults) => {
    return Array.isArray(jimTypeResults) && jimTypeResults.length
        ? jimTypeResults.map(j => j.typeName || '타입명 없음').join(', ')
        : '정보 없음';
};