import { useState, useEffect, useCallback } from 'react';
import { hasUnreadAlarm, hasreadAlarm } from '../api/notification';
import { useLocation } from 'react-router-dom';

export const useDot = (memberId) => {
    const [hasDot, setHasDot] = useState(false);
    const location = useLocation();

    // 서버 unread 체크
    const checkUnread = useCallback(async () => {
        if (!memberId) return setHasDot(false);

        try {
            const res = await hasUnreadAlarm();
            setHasDot(res.data === true);
        } catch (e) {
            console.error('[useDot] unread 체크 실패', e);
            setHasDot(false);
        }
    }, [memberId]);

    const showDot = useCallback(() => setHasDot(true), []);
    const hideDot = useCallback(() => setHasDot(false), []);

    // 알림 페이지 진입 시 읽음 처리
    useEffect(() => {
        const handleNotificationPage = async () => {
            if (location.pathname === '/page/notification') {
                try {
                    await hasreadAlarm(); // 서버에서 읽음 처리
                    hideDot();             // DOT 숨김
                    window.dispatchEvent(
                        new CustomEvent('alarmRead', { detail: { readMemberId: memberId } })
                    );
                } catch (e) {
                    console.error('[useDot] notification 페이지 처리 실패', e);
                }
            }
        };
        handleNotificationPage();
    }, [location.pathname, hideDot, memberId]);

    // 최초 진입 시 서버 상태 확인
    useEffect(() => {
        checkUnread();
    }, [checkUnread]);

    // SSE 이벤트로 새 알림 수신 시 dot 표시
    // useEffect(() => {
    //     const handleAlarm = (event) => {
    //         if (event.detail?.receiverId === memberId) {
    //             showDot();
    //         }
    //     };
    //     window.addEventListener('newAlarmReceived', handleAlarm);
    //     return () => window.removeEventListener('newAlarmReceived', handleAlarm);
    // }, [memberId, showDot]);
    useEffect(() => {
        const handleAlarm = (event) => {
            console.log('[useDot] newAlarmReceived', event.detail, memberId);
            if (String(event.detail?.receiverId) === String(memberId)) {
                console.log('[useDot] showDot 실행!');
                showDot();
            }
        };
        window.addEventListener('newAlarmReceived', handleAlarm);
        return () => window.removeEventListener('newAlarmReceived', handleAlarm);
    }, [memberId, showDot]);

    return { hasDot, showDot, hideDot, refresh: checkUnread };
};
