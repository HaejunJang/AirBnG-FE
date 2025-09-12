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
