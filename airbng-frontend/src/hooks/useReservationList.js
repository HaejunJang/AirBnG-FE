import { useState, useEffect, useCallback } from 'react';
import { deleteReservationApi } from '../api/reservationApi';

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
    const fetchReservations = useCallback(
        async (isFirst = false) => {
            if (loading || (!hasNextPage && !isFirst)) return;

            setLoading(true);

            try {
                const params = {
                    isDropper: currentIsDropper,
                    memberId,
                    state: currentStates,
                };

                // 기간 필터는 COMPLETED, CANCELLED에서만 적용
                const shouldApplyPeriodFilter =
                    ["COMPLETED", "CANCELLED"].some((s) => currentStates.includes(s)) &&
                    currentPeriod !== "ALL";
                if (shouldApplyPeriodFilter) {
                    params.period = currentPeriod;
                }

                if (nextCursorId !== null && nextCursorId !== -1) {
                    params.nextCursorId = nextCursorId;
                }

                const response = await getReservationList(params);
                const result = response.data?.result || {};

                const newReservations = result.reservations || [];
                setNextCursorId(result.nextCursorId);
                setHasNextPage(result.hasNextPage);

                if (isFirst) {
                    setReservations(newReservations);
                    setShowEmpty(newReservations.length === 0);
                } else {
                    setReservations((prev) => [...prev, ...newReservations]);
                }
            } catch (error) {
                console.error("예약 조회 오류:", error);
                if (isFirst) setShowEmpty(true);
            } finally {
                setLoading(false);
            }
        },
        [currentIsDropper, currentStates, currentPeriod, nextCursorId, hasNextPage, loading, memberId]
    );

    // 예약 삭제
    const deleteReservation = async (reservationId) => {
        try {
            const response = await deleteReservationApi(reservationId);
            const data = response.data;

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
            console.error('예약 삭제 오류:', error);
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
    const changeToggle = (isDropper) => {
        if (loading) return;

        setCurrentIsDropper(isDropper);
        setNextCursorId(null);
        setHasNextPage(true);
        setReservations([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 기간 선택
    const selectPeriod = (period) => {
        if (loading) return;

        setCurrentPeriod(period);
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