import React, { useState, useCallback, useEffect, useRef } from 'react';
import {useAlarmSubscription, useSSE} from '../context/SseContext'; // SSEProvider에서 제공
import {loadDeletedIds, saveDeletedIds} from '../hooks/useSSEManager'
import '../styles/pages/notification.css';

// Header 컴포넌트
const Header = ({ title, showBackButton, backUrl }) => (
    <div className="header">
        {showBackButton && (
            <button
                onClick={() => window.location.href = backUrl}
                className="back-button"
            >
                ← 뒤로
            </button>
        )}
        <h1 className="header-title">{title}</h1>
    </div>
);

// Welcome 컴포넌트 (로그인하지 않은 사용자용)
const Welcome = ({ subtitle }) => (
    <div className="welcome-container">
        <div>
            <h2 className="welcome-title">알림 서비스</h2>
            <p className="welcome-subtitle">{subtitle}</p>
            <button className="login-button">로그인하러 가기</button>
        </div>
    </div>
);

// 개별 알림 아이템 컴포넌트
const NotificationItem = ({ notification, onRemove }) => {
    const getTypeLabel = (type) => ({
        'EXPIRED': '만료 알림',
        'REMINDER': '리마인더',
        'STATE_CHANGE': '상태 변경',
        'CANCEL_NOTICE': '취소 알림'
    }[type] || type);

    const getTypeClass = (type) => ({
        'EXPIRED': 'expired',
        'REMINDER': 'reminder',
        'STATE_CHANGE': 'state-change',
        'CANCEL_NOTICE': 'cancel-notice'
    }[type] || '');

    return (
        <div className="notification-item">
            <div className="notification-content">
                <div className="notification-header">
                    <span className={`notification-type ${getTypeClass(notification.type)}`}>
                        {getTypeLabel(notification.type)}
                    </span>
                    <div className="notification-actions">
                        <span className="notification-time">{notification.receivedAt}</span>
                        <button
                            onClick={() => onRemove(notification.id, notification.message, notification.type, notification.reservationId)}
                            className="remove-button"
                        >
                            ×
                        </button>
                    </div>
                </div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-details">
                    예약번호: {notification.reservationId} | 사용자: {notification.nickName}
                </div>
            </div>
        </div>
    );
};

// 알림 목록 컴포넌트
const NotificationList = ({ notifications, deletedNotificationIds, onRemove, onClearAll }) => {
    const getAlarmKey = (alarmData) => `${alarmData.id}|${alarmData.message}|${alarmData.type}|${alarmData.reservationId}`;
    const visibleNotifications = notifications.filter(n => !deletedNotificationIds.has(getAlarmKey(n)));

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
                    모든 알림 지우기
                </button>
            </div>
            <div className="notification-list">
                {visibleNotifications.map((notification, index) => (
                    <NotificationItem
                        key={`${getAlarmKey(notification)}-${index}`}
                        notification={notification}
                        onRemove={onRemove}
                    />
                ))}
            </div>
        </>
    );
};

// 메인 알림 앱 컴포넌트
const NotificationApp = () => {
    // 실제 로그인 사용자 ID 가져오기 (예: window.memberId)
    const [memberId] = useState('3');
    const { alarms, setAlarms, subscribeToAlarms } = useSSE();

    const notificationsRef = useRef([]);
    const deletedRef = useRef(loadDeletedIds());
    const [renderTrigger, setRenderTrigger] = useState(0); // 상태 변경 트리거

    const getAlarmKey = useCallback((alarmData) => `${alarmData.id}|${alarmData.message}|${alarmData.type}|${alarmData.reservationId}`, []);

    const formatDateTime = useCallback((date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? '오후' : '오전';
        hours = hours % 12 || 12;
        return `${year}-${month}-${day} ${ampm} ${String(hours).padStart(2, '0')}:${minutes}`;
    }, []);

    // SSE 알람 처리
    const handleNotification = useCallback((alarmData) => {
        console.log('SSE 알림 받음:', alarmData);
        const now = Date.now();
        const key = getAlarmKey(alarmData);

        if (deletedRef.current.has(key) && now - deletedRef.current.get(key) < 23 * 60 * 60 * 1000) return;
        if (notificationsRef.current.some(n => getAlarmKey(n) === key)) return;

        const newNotification = { ...alarmData, receivedAt: formatDateTime(new Date()) };
        // 중복 제거 후 새 알림 상단 추가
        notificationsRef.current = [
            newNotification,
            ...notificationsRef.current.filter(n => getAlarmKey(n) !== key)
        ].slice(0, 50);

        // 렌더링 트리거
        setRenderTrigger(prev => prev + 1);

        // 브라우저 알림
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(newNotification.message);
        }
    }, [getAlarmKey, formatDateTime]);

    // Notification 권한 요청
    useEffect(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);


    useAlarmSubscription(handleNotification, [memberId]);

    // SSE 구독
    // useEffect(() => {
    //     if (!memberId) return;
    //     const unsubscribe = subscribeToAlarms(handleNotification);
    //     return () => unsubscribe();
    // }, [memberId, subscribeToAlarms, handleNotification]);

    const removeNotification = useCallback((id, message, type, reservationId) => {
        const key = `${id}|${message}|${type}|${reservationId}`;
        notificationsRef.current = notificationsRef.current.filter(n => getAlarmKey(n) !== key);
        deletedRef.current.set(key, Date.now());
        // 삭제한 알림을 localStorage에 저장
        saveDeletedIds(deletedRef.current);
        setRenderTrigger(prev => prev + 1);
    }, [getAlarmKey]);

    const clearAllNotifications = useCallback(() => {
        const now = Date.now();
        notificationsRef.current.forEach(n => deletedRef.current.set(getAlarmKey(n), now));
        notificationsRef.current = [];
        // 삭제한 알림 전체 저장
        saveDeletedIds(deletedRef.current);
        setRenderTrigger(prev => prev + 1);
    }, [getAlarmKey]);

    return (
        <div className="app-container">
            <div className="app-content">
                <div className="main-content">
                    <Header title="알림" showBackButton={true} backUrl="/page/home" />
                    {!memberId ? (
                        <div className="welcome-wrapper">
                            <Welcome subtitle="로그인 후 알림 기능을 사용할 수 있습니다." />
                        </div>
                    ) : (
                        <NotificationList
                            notifications={notificationsRef.current}
                            deletedNotificationIds={deletedRef.current}
                            onRemove={removeNotification}
                            onClearAll={clearAllNotifications}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationApp;
