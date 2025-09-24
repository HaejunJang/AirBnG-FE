import React, { useState, useCallback, useEffect } from 'react';
import { useSSE } from '../context/SseContext';
import { loadDeletedIds, saveDeletedIds } from '../hooks/useSSEManager';
import { getNotification, hasreadAlarm } from '../api/notification';
import '../styles/pages/notification.css';
import {useDot} from "../hooks/useDot";
import {useNavigate} from "react-router-dom";
import Header from '../components/Header/Header';

const Welcome = ({ subtitle }) => {
    const navigate = useNavigate();
    return (
        <div className="welcome-container">
            <div>
                <p className="welcome-subtitle">{subtitle}</p>
                <button
                    className="login-button"
                    onClick={() => navigate("/page/login")}
                >
                    로그인하러 가기
                </button>
            </div>
        </div>
    );
};

const NotificationItem = ({ notification, onRemove }) => {
    const typeMap = {
        EXPIRED: '만료 알림',
        REMINDER: '리마인더',
        STATE_CHANGE: '상태 변경',
        CANCEL_NOTICE: '취소 알림',
        LOCKER_APPROVED: '보관소 승인',
        LOCKER_REJECTED: '보관소 반려'
    };

    const classMap = {
        EXPIRED: 'expired',
        REMINDER: 'reminder',
        STATE_CHANGE: 'state-change',
        CANCEL_NOTICE: 'cancel-notice',
        LOCKER_APPROVED: 'locker-approved',
        LOCKER_REJECTED: 'locker-rejected'
    };

    const showReservationId = !['LOCKER_APPROVED', 'LOCKER_REJECTED'].includes(notification.type);

    return (
        <div className="notification-item">
            <div className="notification-content">
                <div className="notification-header">
          <span className={`notification-type ${classMap[notification.type] || ''}`}>
            {typeMap[notification.type] || notification.type}
          </span>
                    <div className="notification-actions">
                        <span className="notification-time">{notification.receivedAt}</span>
                        <button
                            onClick={() => onRemove(notification)}
                            className="remove-button"
                        >
                            ×
                        </button>
                    </div>
                </div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-details">
                    {showReservationId && <>예약번호: {notification.reservationId} | </>}
                    사용자: {notification.nickName}
                </div>
            </div>
        </div>
    );
};

const safeStr = (v) => {
    if (v === null || v === undefined) return '';
    try { return String(v).trim(); } catch { return '';
    }
};

const normalizeDeletedMap = (maybe) => {
    if (!maybe) return new Map();
    if (maybe instanceof Map) return maybe;
    if (Array.isArray(maybe)) return new Map(maybe);
    if (typeof maybe === 'object') return new Map(Object.entries(maybe));
    return new Map();
};

const getDeletedTimeFrom = (deletedMapLike, key) => {
    if (!deletedMapLike || !key) return undefined;
    if (deletedMapLike instanceof Map) return deletedMapLike.get(key);
    if (Array.isArray(deletedMapLike)) {
        const m = new Map(deletedMapLike);
        return m.get(key);
    }
    if (typeof deletedMapLike === 'object') {
        return deletedMapLike[key];
    }
    return undefined;
};

const NotificationList = ({ notifications, deletedNotificationIds, onRemove, onClearAll, getAlarmKey }) => {
    const TWENTY_THREE_HOURS = 23 * 60 * 60 * 1000;

    // 삭제되지 않았거나 23시간이 지난 알림만 표시
    const visibleNotifications = (notifications || []).filter((notification) => {
        const key = getAlarmKey(notification);
        const deletedTime = getDeletedTimeFrom(deletedNotificationIds, key);

        if (!deletedTime) return true;
        const now = Date.now();
        return (now - deletedTime) >= TWENTY_THREE_HOURS;
    });

    console.log('[NotificationList] 전체 알림:', notifications.length, '표시 알림:', visibleNotifications.length);

    if (visibleNotifications.length === 0) {
        return (
            <div className="notification-list">
                <div className="empty-notifications">⏳ 알림이 없습니다.</div>
            </div>
        );
    }

    return (
        <>
            <div className="clear-all-container">
                <button
                    onClick={onClearAll}
                    disabled={visibleNotifications.length === 0}
                    className={`clear-all-button ${visibleNotifications.length === 0 ? 'disabled' : ''}`}
                >
                    전체 삭제 ({visibleNotifications.length}개)
                </button>
            </div>
            <div className="notification-list">
                {visibleNotifications.map((notification, idx) => {
                    const key = getAlarmKey(notification) || `idx-${idx}`;
                    return (
                        <NotificationItem
                            key={`${key}-${idx}`}
                            notification={notification}
                            onRemove={onRemove}
                        />
                    );
                })}
            </div>
        </>
    );
};


const NotificationApp = () => {
    const { alarms, isConnected, memberId } = useSSE();
    const { hideDot } = useDot(memberId);

    // loadDeletedIds가 반환하는 형태가 Map이 아닐 수 있으니 안전하게 처리
    const [deletedRef, setDeletedRef] = useState(() => normalizeDeletedMap(loadDeletedIds(memberId)));

    const TWENTY_THREE_HOURS = 23 * 60 * 60 * 1000;

    // 통일된 키 생성 함수 — NotificationList에 prop으로 전달
    const getAlarmKey = useCallback((alarm) => {
        if (!alarm) return null;

        const type = safeStr(alarm.type);
        const receiver = safeStr(alarm.receiverId || alarm.receiver || alarm.to || alarm.receiverId);
        const message = safeStr(alarm.message);
        const receivedAt = safeStr(alarm.receivedAt);
        const reservationId = safeStr(alarm.reservationId);

        if (alarm.id) return `id-${safeStr(alarm.id)}`;
        if (alarm.eventId) return `event-${safeStr(alarm.eventId)}`;

        // 보관소 승인/거절: message 포함해서 키 생성
        if (['LOCKER_APPROVED', 'LOCKER_REJECTED'].includes(type)) {
            //message가 다르면 새 알림으로 취급
            return `locker-${type}-${message}-${receiver}-${receivedAt}`;
        }

        // 예약 관련 알림
        if (reservationId && receiver && type && receivedAt) {
            return `res-${reservationId}-${receiver}-${type}-${receivedAt}`;
        }

        // 일반
        if (type && receivedAt && receiver) return `${type}-${receivedAt}-${receiver}`;

        if (type && receivedAt) return `${type}-${receivedAt}`;

        try {
            return `json-${JSON.stringify(alarm)}`;
        } catch (e) {
            return `unknown-${Math.random()}`;
        }
    }, []);

    // 컴포넌트 마운트 시 브라우저 알림 권한 확인
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then((permission) => {});
            } else {
                console.log('[NotificationApp] 현재 브라우저 알림 권한:', Notification.permission);
            }
        }
    }, []);

    // 삭제된 알림 목록 정리 (컴포넌트 마운트 시)
    useEffect(() => {
        const now = Date.now();
        setDeletedRef((prev) => {
            const prevMap = normalizeDeletedMap(prev);
            const newMap = new Map();
            let cleanedCount = 0;

            for (const [key, deletedTime] of prevMap) {
                if ((now - deletedTime) < TWENTY_THREE_HOURS) {
                    newMap.set(key, deletedTime);
                } else {
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0) {
                try {
                    saveDeletedIds(newMap, memberId);
                } catch (e) {
                    console.warn('[NotificationApp] saveDeletedIds 실패', e);
                }
            }

            return newMap;
        });
    }, [TWENTY_THREE_HOURS, memberId]);

    // 개별 알림 삭제
    const removeNotification = useCallback((notification) => {
        if (!notification) return;

        const key = getAlarmKey(notification);
        if (!key) {
            console.warn('[removeNotification] key 생성 실패', notification);
            return;
        }

        const now = Date.now();

        setDeletedRef((prevMapLike) => {
            const prevMap = normalizeDeletedMap(prevMapLike);
            const newMap = new Map(prevMap);
            newMap.set(key, now);

            try {
                saveDeletedIds(newMap, memberId);
            } catch (error) {
                console.error('[NotificationApp] 전체 삭제 저장 실패:', error);
            }

            console.log('[removeNotification] 삭제 처리:', key, 'time:', now);
            return newMap;
        });
    }, [getAlarmKey, memberId]);

    // 모든 알림 삭제
    const clearAllNotifications = useCallback(() => {
        if (!alarms || alarms.length === 0) return;

        const now = Date.now();

        setDeletedRef((prevMapLike) => {
            const prevMap = normalizeDeletedMap(prevMapLike);
            const newMap = new Map(prevMap);
            let newDeletedCount = 0;

            // 현재 보이는 모든 알림을 삭제 처리
            alarms.forEach((notification) => {
                const key = getAlarmKey(notification);
                if (!key) return;

                const existingDeletedTime = prevMap.get(key);

                if (!existingDeletedTime || (now - existingDeletedTime >= TWENTY_THREE_HOURS)) {
                    newMap.set(key, now);
                    newDeletedCount++;
                }
            });

            try {
                saveDeletedIds(newMap, memberId);
            } catch (error) {
                console.error('[NotificationApp] 전체 삭제 저장 실패:', error);
            }

            console.log('[clearAllNotifications] 삭제된 알림 수:', newDeletedCount);
            return newMap;
        });
    }, [alarms, getAlarmKey, memberId]);

    // 알림 페이지 진입 시 읽음 처리
    useEffect(() => {
        if (!memberId) return;

        const handleAlarm = async (event) => {
            const receiverId = String(event.detail?.receiverId);
            const myId = String(memberId);

            if (receiverId === myId && window.location.pathname === '/page/notification') {
                try {
                    await hasreadAlarm();
                    hideDot();
                    window.dispatchEvent(new CustomEvent('alarmRead', { detail: { readMemberId: memberId } }));
                } catch (e) {
                    console.error('[NotificationApp] SSE 알림 읽음 처리 실패', e);
                }
            }
        };

        window.addEventListener('newAlarmReceived', handleAlarm);
        return () => window.removeEventListener('newAlarmReceived', handleAlarm);
    }, [memberId, hideDot]);

    console.log('[NotificationApp] 렌더링 - 연결상태:', isConnected, '총 알림:', alarms?.length || 0);

    return (
        <div className="app-container">
            <div className="notification-app-content">
                <div className="main-content">
                    <Header
                        headerTitle="알림"
                        showBackButton={true}
                        backUrl="/page/home"
                    />
                    {!memberId ? (
                        <div className="welcome-wrapper">
                            <Welcome subtitle="로그인 후 사용 가능합니다." />
                        </div>
                    ) : (
                        <>
                            <NotificationList
                                notifications={alarms || []}
                                deletedNotificationIds={deletedRef}
                                onRemove={removeNotification}
                                onClearAll={clearAllNotifications}
                                getAlarmKey={getAlarmKey} // 통일된 키 생성기 전달
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationApp;