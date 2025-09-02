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
    const [backendMessage, setBackendMessage] = useState("");

    //예약 가져오기
    // const fetchReservations = useCallback(
    //     async (isFirst = false) => {
    //         if (!memberId || memberId <= 0) return;
    //         if (currentIsDropper === null || currentIsDropper === undefined) return;
    //         if (loading || (!hasNextPage && !isFirst)) return;
    //
    //         setLoading(true);
    //
    //         try {
    //             const params = {
    //                 isDropper: currentIsDropper,
    //                 memberId,
    //             };
    //
    //             if (currentStates?.length > 0) {
    //                 params.state = currentStates;
    //             }
    //
    //             // COMPLETED / CANCELLED 상태일 때만 period 세팅
    //             if (
    //                 ["COMPLETED", "CANCELLED"].some((s) => currentStates.includes(s)) &&
    //                 periodOptions.includes(currentPeriod)
    //             ) {
    //                 params.period = currentPeriod;
    //             }
    //
    //             if (nextCursorId !== null && nextCursorId !== -1) {
    //                 params.nextCursorId = nextCursorId;
    //             }
    //
    //             console.log("Reservation API params:", params);
    //
    //             const response = await getReservationList(params);
    //
    //             let newReservations = [];
    //             if (response.data.code === 4015) {
    //                 newReservations = []; // 예약 내역 없을 때 처리
    //             } else {
    //                 newReservations = response.data?.result?.reservations || [];
    //             }
    //
    //             setNextCursorId(result.nextCursorId);
    //             setHasNextPage(result.hasNextPage);
    //
    //             if (isFirst) {
    //                 setReservations(newReservations);
    //                 setShowEmpty(newReservations.length === 0);
    //             } else {
    //                 setReservations((prev) => [...prev, ...newReservations]);
    //             }
    //         } catch (error) {
    //             console.error("예약 조회 오류:", error);
    //             if (isFirst) setShowEmpty(true);
    //         } finally {
    //             setLoading(false);
    //         }
    //     },
    //     [currentIsDropper, currentStates, currentPeriod, nextCursorId, hasNextPage, loading, memberId]
    // );

    const fetchReservations = useCallback(async (isFirst = false) => {
        if (!memberId || memberId <= 0) return;
        if (loading) return;

        setLoading(true);
        try {
            const params = {
                isDropper: currentIsDropper,
                memberId
            };

            if (currentStates?.length > 0) params.state = currentStates;

            if (["COMPLETED","CANCELLED"].some(s => currentStates.includes(s)) && periodOptions.includes(currentPeriod)) {
                params.period = currentPeriod;
            }

            if (nextCursorId) params.nextCursorId = nextCursorId;

            const response = await getReservationList(params);

            let newReservations = [];
            let backendMsg = "";

            if (response.data.code == 4015) {
                // 백엔드가 "예약 내역 없음"이라고 보냈을 때
                newReservations = [];
                backendMsg = response.data.message || "예약 내역이 없습니다.";
                setHasNextPage(false);
                setNextCursorId(null);
            } else {

                const result = response.data?.result || {};
                newReservations = result.reservations || [];
                setNextCursorId(result.nextCursorId ?? null);
                setHasNextPage(result.hasNextPage ?? false);

                // newReservations = response.data?.result?.reservations || [];
            }

            setReservations(prev => isFirst ? newReservations : [...prev, ...newReservations]);
            setShowEmpty(newReservations.length === 0 && isFirst);
            setBackendMessage(backendMsg);
            // setNextCursorId(response.data?.result?.nextCursorId ?? null);
            // setHasNextPage(response.data?.result?.hasNextPage ?? false);

        } catch (err) {
            console.error(err);
            if (isFirst) {
                setReservations([]);
                setShowEmpty(true);
                setBackendMessage("예약 내역을 불러오는 중 오류가 발생했습니다.");
                setNextCursorId(null);
                setHasNextPage(false);
            }
        } finally {
            setLoading(false);
        }
    }, [memberId, currentIsDropper, currentStates, currentPeriod, nextCursorId, loading]);

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

    // useEffect(() => {
    //     const handleScroll = () => {
    //         if (loading || !hasNextPage) return;
    //         const scrollTop = window.scrollY;
    //         const viewportHeight = window.innerHeight;
    //         const fullHeight = document.body.offsetHeight;
    //
    //         if (scrollTop + viewportHeight >= fullHeight - 200) {
    //             fetchReservations(false);
    //         }
    //     };
    //     window.addEventListener("scroll", handleScroll);
    //     return () => window.removeEventListener("scroll", handleScroll);
    // }, [fetchReservations, loading, hasNextPage]);

    useEffect(() => {
        if (memberId) fetchReservations(true);
    }, [memberId, currentStates, currentPeriod, currentIsDropper]);

    return {
        currentStates,
        currentPeriod,
        currentIsDropper,
        loading,
        reservations,
        showEmpty,
        backendMessage,
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
        hasNextPage,
        setReservations,
    };
};

export default useReservationList;
