import { useState, useEffect, useCallback } from "react";
import { getReservationList, deleteReservationApi } from "../api/reservationApi";

const periodOptions = ["1W", "3M", "6M", "1Y", "2Y", "ALL"];

const useReservationList = (memberId) => {
    const [currentStates, setCurrentStates] = useState(["CONFIRMED", "PENDING"]);
    const [currentPeriod, setCurrentPeriod] = useState("ALL");
    const [currentIsDropper, setCurrentIsDropper] = useState(true);
    const [nextCursorId, setNextCursorId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [reservations, setReservations] = useState([]);
    const [showEmpty, setShowEmpty] = useState(false);

    //예약 가져오기
    const fetchReservations = useCallback(
        async (isFirst = false) => {
            if (!memberId || memberId <= 0) return;
            if (currentIsDropper === null || currentIsDropper === undefined) return;
            if (loading || (!hasNextPage && !isFirst)) return;

            setLoading(true);

            try {
                const params = {
                    isDropper: currentIsDropper,
                    memberId,
                    // 여기서 isHistoryTab 제거
                };

                if (currentStates?.length > 0) {
                    params.state = currentStates;
                }

                // COMPLETED / CANCELLED 상태일 때만 period 세팅
                if (
                    ["COMPLETED", "CANCELLED"].some((s) => currentStates.includes(s)) &&
                    currentPeriod !== "ALL" &&
                    periodOptions.includes(currentPeriod)
                ) {
                    params.period = currentPeriod;
                }

                if (nextCursorId !== null && nextCursorId !== -1) {
                    params.nextCursorId = nextCursorId;
                }

                console.log("Reservation API params:", params);

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

    const deleteReservation = async (reservationId) => {
        try {
            const response = await deleteReservationApi(reservationId);
            const data = response.data;

            if (data.code === 1000) {
                setNextCursorId(null);
                setHasNextPage(true);
                setReservations([]);
                await fetchReservations(true);
                return { success: true, refundAmount: data.refundAmount || 0 };
            } else {
                return { success: false };
            }
        } catch (error) {
            console.error("예약 삭제 오류:", error);
            return { success: false };
        }
    };

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
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [fetchReservations, loading, hasNextPage]);

    useEffect(() => {
        fetchReservations(true);
    }, [currentStates, currentPeriod, currentIsDropper]);

    return {
        currentStates,
        currentPeriod,
        currentIsDropper,
        loading,
        reservations,
        showEmpty,
        changeTab: (newStates) => {
            if (loading) return;
            setCurrentStates(newStates);
            setCurrentPeriod("ALL");
            setNextCursorId(null);
            setHasNextPage(true);
            setReservations([]);
            window.scrollTo({ top: 0, behavior: "smooth" });
        },
        changeToggle: (isDropper) => {
            if (loading) return;
            setCurrentIsDropper(isDropper);
            setNextCursorId(null);
            setHasNextPage(true);
            setReservations([]);
            window.scrollTo({ top: 0, behavior: "smooth" });
        },
        selectPeriod: (period) => {
            if (loading) return;
            setCurrentPeriod(period);
            setNextCursorId(null);
            setHasNextPage(true);
            setReservations([]);
        },
        deleteReservation,
        fetchReservations,
    };
};

export default useReservationList;
