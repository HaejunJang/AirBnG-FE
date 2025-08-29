import { useState, useEffect, useCallback } from 'react';

const useReservationList = (memberId, contextPath) => {
    // State 관리
    const [currentStates, setCurrentStates] = useState(['CONFIRMED', 'PENDING']);
    const [currentPeriod, setCurrentPeriod] = useState('ALL');
    const [currentIsDropper, setCurrentIsDropper] = useState(true);
    const [nextCursorId, setNextCursorId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [reservations, setReservations] = useState([]);
    const [showEmpty, setShowEmpty] = useState(false);

    // API URL 생성
    const getApiUrl = useCallback(() => {
        const baseUrl = `${contextPath}/reservations?isDropper=${currentIsDropper}&memberId=${memberId}`;
        const statesParam = currentStates.map(s => `&state=${s}`).join('');
        const shouldApplyPeriodFilter = (['COMPLETED', 'CANCELLED'].some(s => currentStates.includes(s)) && currentPeriod !== 'ALL');
        const periodParam = shouldApplyPeriodFilter ? `&period=${currentPeriod}` : '';
        const cursorParam = (nextCursorId !== null && nextCursorId !== -1) ? `&nextCursorId=${nextCursorId}` : '';
        return baseUrl + statesParam + periodParam + cursorParam;
    }, [currentIsDropper, currentStates, currentPeriod, nextCursorId, memberId, contextPath]);

    // 예약 데이터 가져오기
    const fetchReservations = useCallback(async (isFirst = false) => {
        if (loading || (!hasNextPage && !isFirst)) return;

        setLoading(true);

        try {
            const response = await fetch(getApiUrl());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const newReservations = data.result.reservations || [];

            setNextCursorId(data.result.nextCursorId);
            setHasNextPage(data.result.hasNextPage);

            if (isFirst) {
                setReservations(newReservations);
                setShowEmpty(newReservations.length === 0);
            } else {
                setReservations(prev => [...prev, ...newReservations]);
            }
        } catch (error) {
            console.error('Fetch 오류:', error);
            if (isFirst) setShowEmpty(true);
        } finally {
            setLoading(false);
        }
    }, [getApiUrl, loading, hasNextPage]);

    // 예약 삭제
    const deleteReservation = async (reservationId) => {
        try {
            const response = await fetch(`${contextPath}/reservations/delete?reservationId=${reservationId}`, {
                method: 'POST'
            });
            const data = await response.json();

            if (data.code === 1000) {
                // 목록 새로고침
                setNextCursorId(null);
                setHasNextPage(true);
                setReservations([]);
                await fetchReservations(true);
                return { success: true, refundAmount: data.refundAmount || 0 };
            } else {
                return { success: false };
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            return { success: false };
        }
    };

    // 스크롤 이벤트 처리
    useEffect(() => {
        const handleScroll = () => {
            if (loading || !hasNextPage) return;

            const scrollTop = window.scrollY;
            const viewportHeight = window.innerHeight;
            const fullHeight = document.body.offsetHeight;

            if (scrollTop + viewportHeight >= fullHeight - 200) {
                fetchReservations(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchReservations, loading, hasNextPage]);

    // 초기 데이터 로드
    useEffect(() => {
        fetchReservations(true);
    }, [currentStates, currentPeriod, currentIsDropper]);

    // 탭 변경
    const changeTab = (newStates) => {
        if (loading) return;

        setCurrentStates(newStates);
        setCurrentPeriod('ALL');
        setNextCursorId(null);
        setHasNextPage(true);
        setReservations([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 토글 변경
    const changeToggle = (newIsDropper) => {
        if (loading) return;

        setCurrentIsDropper(newIsDropper);
        setNextCursorId(null);
        setHasNextPage(true);
        setReservations([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 기간 선택
    const selectPeriod = (newPeriod) => {
        if (loading) return;

        setCurrentPeriod(newPeriod);
        setNextCursorId(null);
        setHasNextPage(true);
        setReservations([]);
    };

    return {
        // State
        currentStates,
        currentPeriod,
        currentIsDropper,
        loading,
        reservations,
        showEmpty,
        // Actions
        changeTab,
        changeToggle,
        selectPeriod,
        deleteReservation,
        fetchReservations
    };
};

export default useReservationList;