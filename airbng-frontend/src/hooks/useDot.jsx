
// import { useState, useEffect, useCallback } from 'react';
// import { hasUnreadAlarm, hasreadAlarm } from '../api/notification';
// import { useLocation } from 'react-router-dom';
//
// export const useDot = (memberId) => {
//     const [hasDot, setHasDot] = useState(false);
//     const location = useLocation();
//
//     // 서버 unread 체크 (로그인 후 최초 확인 용도)
//     const checkUnread = useCallback(async () => {
//         if (!memberId) {
//             setHasDot(false);
//             return;
//         }
//
//         try {
//             const res = await hasUnreadAlarm();
//             // 서버가 true/false 반환한다고 가정
//             if (res.data === true) {
//                 setHasDot(true);   // unread 있으면 dot 표시
//             } else {
//                 setHasDot(false);  // 없으면 dot 숨김
//             }
//         } catch (e) {
//             console.error('[useDot] unread 체크 실패', e);
//             setHasDot(false);
//         }
//     }, [memberId]);
//
//     const showDot = useCallback(() => setHasDot(true), []);
//     const hideDot = useCallback(() => setHasDot(false), []);
//
//     // 알림 페이지 들어가면 읽음 처리
//     useEffect(() => {
//         const handleNotificationPage = async () => {
//             if (location.pathname === '/page/notification') {
//                 try {
//                     await hasreadAlarm();
//                     hideDot(); // dot 숨김
//                     window.dispatchEvent(
//                         new CustomEvent('alarmRead', { detail: { readMemberId: memberId } })
//                     );
//                 } catch (e) {
//                     console.error('[useDot] notification 페이지 처리 실패', e);
//                 }
//             }
//         };
//         handleNotificationPage();
//     }, [location.pathname, hideDot, memberId]);
//
//     // 최초 로그인/진입 시 서버 unread 상태 확인
//     useEffect(() => {
//         checkUnread();
//     }, [checkUnread]);
//
//     // SSE 새 알림 수신 시 dot 표시
//     useEffect(() => {
//         const handleAlarm = (event) => {
//             console.log('[useDot] newAlarmReceived', event.detail, memberId);
//             if (String(event.detail?.receiverId) === String(memberId)) {
//                 console.log('[useDot] showDot 실행!');
//                 showDot();
//             }
//         };
//         window.addEventListener('newAlarmReceived', handleAlarm);
//         return () => window.removeEventListener('newAlarmReceived', handleAlarm);
//     }, [memberId, showDot]);
//
//     return { hasDot, showDot, hideDot, refresh: checkUnread };
// };


// import { useState, useEffect, useCallback } from 'react';
// import { hasUnreadAlarm, hasreadAlarm } from '../api/notification';
// import { useLocation } from 'react-router-dom';
//
// export const useDot = (memberId) => {
//     const [hasDot, setHasDot] = useState(false);
//     const location = useLocation();
//
//     // 서버 unread 체크 (로그인 후 최초 확인 용도)
//     const checkUnread = useCallback(async () => {
//         if (!memberId) {
//             setHasDot(false);
//             return;
//         }
//
//         try {
//             const res = await hasUnreadAlarm();
//             setHasDot(res.data === true); // true면 dot 표시, false면 숨김
//         } catch (e) {
//             console.error('[useDot] unread 체크 실패', e);
//             setHasDot(false);
//         }
//     }, [memberId]);
//
//     const showDot = useCallback(() => setHasDot(true), []);
//     const hideDot = useCallback(() => setHasDot(false), []);
//
//     // 알림 페이지 진입 시 읽음 처리
//     useEffect(() => {
//         const handleNotificationPage = async () => {
//             if (location.pathname === '/page/notification') {
//                 try {
//                     await hasreadAlarm(); // 서버에서 읽음 처리
//                     hideDot();             // dot 숨김
//                     window.dispatchEvent(
//                         new CustomEvent('alarmRead', { detail: { readMemberId: memberId } })
//                     );
//                 } catch (e) {
//                     console.error('[useDot] notification 페이지 처리 실패', e);
//                 }
//             }
//         };
//         handleNotificationPage();
//     }, [location.pathname, hideDot, memberId]);
//
//     // SSE 새 알림 수신 시 dot 표시
//     useEffect(() => {
//         const handleAlarm = (event) => {
//             const receiverId = String(event.detail?.receiverId);
//             const myId = String(memberId);
//
//             // 알림 페이지가 아니고, 내 알림이면 dot 표시
//             if (location.pathname !== '/page/notification' && receiverId === myId) {
//                 showDot();
//             }
//         };
//         window.addEventListener('newAlarmReceived', handleAlarm);
//         return () => window.removeEventListener('newAlarmReceived', handleAlarm);
//     }, [memberId, showDot, location.pathname]);
//
//     useEffect(() => {
//         const handleNotificationPage = async () => {
//             if (location.pathname === '/page/notification') {
//                 try {
//                     await hasreadAlarm(); // 서버에서 읽음 처리
//                     hideDot();             // dot 숨김
//                     window.dispatchEvent(
//                         new CustomEvent('alarmRead', { detail: { readMemberId: memberId } })
//                     );
//                 } catch (e) {
//                     console.error('[useDot] notification 페이지 처리 실패', e);
//                 }
//             }
//         };
//         handleNotificationPage();
//     }, [location.pathname, hideDot, memberId]);
//
//
//     // 알림 페이지 벗어나면 dot 숨김
//     useEffect(() => {
//         if (location.pathname !== '/page/notification') {
//             hideDot();
//         }
//     }, [location.pathname, hideDot]);
//
//     // 최초 로그인/진입 시 서버 unread 상태 확인
//     useEffect(() => {
//         checkUnread();
//     }, [checkUnread]);
//
//     return { hasDot, showDot, hideDot, refresh: checkUnread };
// };


//
// import { useState, useEffect, useCallback, useRef } from 'react';
// import { hasUnreadAlarm, hasreadAlarm } from '../api/notification';
// import { useLocation } from 'react-router-dom';
//
// export const useDot = (memberId) => {
//     const [hasDot, setHasDot] = useState(false);
//     const location = useLocation();
//     const currentPath = useRef(location.pathname);
//
//     // 현재 페이지 ref 갱신
//     useEffect(() => {
//         currentPath.current = location.pathname;
//     }, [location.pathname]);
//
//     const showDot = useCallback(() => setHasDot(true), []);
//     const hideDot = useCallback(() => setHasDot(false), []);
//
//     // 로그인/진입 시 서버 unread 체크
//     const checkUnread = useCallback(async () => {
//         if (!memberId) return;
//         try {
//             const res = await hasUnreadAlarm();
//             setHasDot(res.data === true);
//         } catch (e) {
//             console.error('[useDot] unread 체크 실패', e);
//             setHasDot(false);
//         }
//     }, [memberId]);
//
//     // 알림 페이지 진입 시 읽음 처리
//     useEffect(() => {
//         if (currentPath.current === '/page/notification' && memberId) {
//             const markRead = async () => {
//                 try {
//                     await hasreadAlarm();
//                     hideDot();
//                     window.dispatchEvent(
//                         new CustomEvent('alarmRead', { detail: { readMemberId: memberId } })
//                     );
//                 } catch (e) {
//                     console.error('[useDot] notification 페이지 읽음 처리 실패', e);
//                 }
//             };
//             markRead();
//         }
//     }, [memberId, hideDot]);
//
//     // SSE 새 알림 수신 시 dot 표시
//     useEffect(() => {
//         const handleAlarm = (event) => {
//             const receiverId = String(event.detail?.receiverId);
//             const myId = String(memberId);
//
//             // 알림 페이지에서 받은 알림이면 무조건 dot 표시 안 함
//             if (currentPath.current === '/page/notification') {
//                 return; // dot 표시 안 함
//             }
//
//             // 알림 페이지가 아니고 내 알림이면 dot 표시
//             if (receiverId === myId) {
//                 showDot();
//             }
//         };
//
//         window.addEventListener('newAlarmReceived', handleAlarm);
//         return () => window.removeEventListener('newAlarmReceived', handleAlarm);
//     }, [memberId, showDot]);
//
//     // 최초 로그인/진입 시 서버 unread 상태 확인
//     useEffect(() => {
//         checkUnread();
//     }, [checkUnread]);
//
//     return { hasDot, showDot, hideDot, refresh: checkUnread };
// };


import { useState, useEffect, useCallback } from 'react';
import { hasUnreadAlarm, hasreadAlarm } from '../api/notification';
import { useLocation } from 'react-router-dom';

export const useDot = (memberId) => {
    const [hasDot, setHasDot] = useState(false);
    const location = useLocation();

    const showDot = useCallback(() => setHasDot(true), []);
    const hideDot = useCallback(() => setHasDot(false), []);

    // 서버 unread 체크 (로그인 후 최초 확인 용도)
    const checkUnread = useCallback(async () => {
        if (!memberId) {
            setHasDot(false);
            return;
        }
        try {
            const res = await hasUnreadAlarm();
            setHasDot(res.data === true);
        } catch (e) {
            console.error('[useDot] unread 체크 실패', e);
            setHasDot(false);
        }
    }, [memberId]);

    // 알림 페이지 진입 시 읽음 처리
    useEffect(() => {
        const markRead = async () => {
            if (!memberId) return;
            if (location.pathname === '/page/notification') {
                try {
                    await hasreadAlarm();
                    hideDot();
                    window.dispatchEvent(
                        new CustomEvent('alarmRead', { detail: { readMemberId: memberId } })
                    );
                    console.log('[useDot] 알림 페이지 진입 → 읽음 처리 완료');
                } catch (e) {
                    console.error('[useDot] notification 페이지 읽음 처리 실패', e);
                }
            }
        };
        markRead();
    }, [memberId, hideDot, location.pathname]);

    // SSE 새 알림 수신 시 dot 표시
    useEffect(() => {
        const handleAlarm = (event) => {
            const receiverId = String(event.detail?.receiverId);
            const myId = String(memberId);

            // 알림 페이지에서는 dot 표시 안 함
            if (location.pathname === '/page/notification') return;

            if (receiverId === myId) {
                showDot();
                console.log('[useDot] SSE 알림 수신 → dot 표시');
            }
        };

        window.addEventListener('newAlarmReceived', handleAlarm);
        return () => window.removeEventListener('newAlarmReceived', handleAlarm);
    }, [memberId, showDot, location.pathname]);

    // 최초 로그인/진입 시 서버 unread 상태 확인
    useEffect(() => {
        checkUnread();
    }, [checkUnread]);

    return { hasDot, showDot, hideDot, refresh: checkUnread };
};
