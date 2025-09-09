// import { useState, useEffect, useCallback } from "react";
// import { useSSE } from "../context/SseContext";
// import { hasUnreadAlarm } from "../api/notification";
// import { useLocation } from "react-router-dom";
//
// export const useDot = (memberId) => {
//     const [hasDot, setHasDot] = useState(false);
//     const sse = useSSE();
//     const location = useLocation();
//
//     // 서버에서 memberId 기준으로 unread 상태 확인
//     const updateDot = useCallback(async () => {
//         if (!memberId) return;
//         try {
//             const res = await hasUnreadAlarm(memberId); // boolean
//             setHasDot(res.data);
//         } catch (e) {
//             console.error("Unread 알림 체크 실패:", e);
//         }
//     }, [memberId]);
//
//     // 초기 렌더링 시 체크
//     useEffect(() => {
//         updateDot();
//     }, [updateDot]);
//
//     // SSE 이벤트 수신 시 dot 업데이트
//     useEffect(() => {
//         if (!sse || !memberId) return;
//
//         const handleAlarm = (alarmData) => {
//             // alarmData.memberId가 현재 memberId와 일치하면 표시
//             if (alarmData?.memberId === memberId) {
//                 console.log("[SSE] 새 알림 도착, dot 업데이트");
//                 updateDot();
//             }
//         };
//
//         sse.addEventListener("alarm", handleAlarm);
//         return () => sse.removeEventListener("alarm", handleAlarm);
//     }, [sse, updateDot, memberId]);
//
//     // 알림 페이지 방문 시 dot 숨김
//     useEffect(() => {
//         if (location.pathname === "/page/notification") {
//             setHasDot(false);
//         }
//     }, [location.pathname]);
//
//     return { hasDot };
// };
//
import { useState, useEffect, useCallback } from "react";
import { useSSE } from "../context/SseContext";
import { hasUnreadAlarm } from "../api/notification";
import { useLocation } from "react-router-dom";

export const useDot = () => {
    const [hasDot, setHasDot] = useState(false);
    const sse = useSSE();
    const location = useLocation();

    // 서버에서 안읽음 상태 확인
    const updateDot = useCallback(async () => {
        try {
            const res = await hasUnreadAlarm(); // memberId 없이 호출
            setHasDot(res.data); // true면 dot 표시
            console.log("[Dot] 업데이트 완료:", res.data);
        } catch (e) {
            console.error("[Dot] Unread 알림 체크 실패:", e);
        }
    }, []);

    // 초기 렌더링 시 체크
    useEffect(() => {
        updateDot();
    }, [updateDot]);

    // SSE 이벤트 수신 시 dot 업데이트
    useEffect(() => {
        if (!sse) return;

        const handleAlarm = (alarmData) => {
            console.log("[SSE] 새 알림 도착, dot 업데이트");
            updateDot();
        };

        sse.addEventListener("alarm", handleAlarm);
        return () => sse.removeEventListener("alarm", handleAlarm);
    }, [sse, updateDot]);

    // 알림 페이지 방문 시 dot 숨김
    useEffect(() => {
        if (location.pathname === "/page/notification") {
            setHasDot(false);
        }
    }, [location.pathname]);

    return { hasDot };
};
