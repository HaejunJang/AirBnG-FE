import React, { useState, useCallback, useEffect } from 'react';
import { useSSE } from '../context/SseContext'; // SSEProvider에서 제공
import { getNotification } from '../api/notification';
import '../styles/pages/notification.css';

// // SSE Manager Mock (실제 구현 시 외부 파일로 분리)
// const getSSEManager = () => ({
//     addEventListener: (event, callback) => {
//         // 실제 SSE 구현
//     },
//     init: () => {
//         // SSE 초기화
//     }
// });

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
    const getTypeLabel = (type) => {
        const labelMap = {
            'EXPIRED': '만료 알림',
            'REMINDER': '리마인더',
            'STATE_CHANGE': '상태 변경',
            'CANCEL_NOTICE': '취소 알림'
        };
        return labelMap[type] || type;
    };

    const getTypeClass = (type) => {
        const classMap = {
            'EXPIRED': 'expired',
            'REMINDER': 'reminder',
            'STATE_CHANGE': 'state-change',
            'CANCEL_NOTICE': 'cancel-notice'
        };
        return classMap[type] || '';
    };

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
    const getAlarmKey = (alarmData) => {
        return `${alarmData.id}|${alarmData.message}|${alarmData.type}|${alarmData.reservationId}`;
    };

    const visibleNotifications = notifications.filter(n => {
        const alarmKey = getAlarmKey(n);
        return !deletedNotificationIds.has(alarmKey);
    });

    const visibleCount = visibleNotifications.length;

    if (visibleCount === 0) {
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
                    disabled={visibleCount === 0}
                    className={`clear-all-button ${visibleCount === 0 ? 'disabled' : ''}`}
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
    // 데모를 위해 로그인한 사용자로 설정
    const [memberId] = useState('demo_user_123');
    const [notifications, setNotifications] = useState([
        {
            id: 'n001',
            message: '예약이 30분 후 시작됩니다. 준비해주세요!',
            type: 'REMINDER',
            reservationId: 'RES20240302001',
            nickName: '김철수',
            receivedAt: '2024-03-02 오후 02:30'
        },
        {
            id: 'n002',
            message: '예약이 취소되었습니다. 확인 후 연락드리겠습니다.',
            type: 'CANCEL_NOTICE',
            reservationId: 'RES20240302002',
            nickName: '이영희',
            receivedAt: '2024-03-02 오후 01:45'
        },
        {
            id: 'n003',
            message: '예약 상태가 승인됨으로 변경되었습니다.',
            type: 'STATE_CHANGE',
            reservationId: 'RES20240302003',
            nickName: '박민수',
            receivedAt: '2024-03-02 오후 01:20'
        },
        {
            id: 'n004',
            message: '예약 시간이 만료되었습니다. 새로 예약해주세요.',
            type: 'EXPIRED',
            reservationId: 'RES20240301005',
            nickName: '정수진',
            receivedAt: '2024-03-02 오전 11:30'
        },
        {
            id: 'n005',
            message: '내일 예약이 있습니다. 잊지 마세요!',
            type: 'REMINDER',
            reservationId: 'RES20240303001',
            nickName: '최영수',
            receivedAt: '2024-03-01 오후 06:00'
        }
    ]);
    const [deletedNotificationIds, setDeletedNotificationIds] = useState(new Map());
    const { subscribeToAlarms } = useSSE();

    const getAlarmKey = useCallback((alarmData) => {
        return `${alarmData.id}|${alarmData.message}|${alarmData.type}|${alarmData.reservationId}`;
    }, []);

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
        const now = Date.now();
        const key = getAlarmKey(alarmData);

        // 삭제된 알림 확인
        const deletedAt = deletedNotificationIds.get(key);
        if (deletedAt && now - deletedAt < 23 * 60 * 60 * 1000) return;

        // 중복 확인
        const isDuplicate = notifications.some(n => getAlarmKey(n) === key);
        if (isDuplicate) return;

        const newNotification = {
            ...alarmData,
            receivedAt: formatDateTime(new Date())
        };

        setNotifications(prev => {
            const updated = [newNotification, ...prev];
            return updated.slice(0, 50); // 최대 50개
        });
    }, [notifications, deletedNotificationIds, getAlarmKey, formatDateTime]);

    // 알람 구독
    useEffect(() => {
        if (!memberId) return;
        const unsubscribe = subscribeToAlarms(handleNotification);
        return unsubscribe;
    }, [subscribeToAlarms, handleNotification, memberId]);

    // 알림 삭제
    const removeNotification = useCallback((id, message, type, reservationId) => {
        const key = `${id}|${message}|${type}|${reservationId}`;
        setNotifications(prev => prev.filter(n => getAlarmKey(n) !== key));
        setDeletedNotificationIds(prev => new Map(prev).set(key, Date.now()));
    }, [getAlarmKey]);

    const clearAllNotifications = useCallback(() => {
        const now = Date.now();
        setDeletedNotificationIds(prev => {
            const newDeleted = new Map(prev);
            notifications.forEach(n => {
                newDeleted.set(getAlarmKey(n), now);
            });
            return newDeleted;
        });
        setNotifications([]);
    }, [notifications, getAlarmKey]);

    // 서버에서 알림 읽음 처리
    useEffect(() => {
        if (!memberId) return;
        getNotification()
            .then(() => console.log(`서버에서 알림 읽음 처리 완료 (memberId=${memberId})`))
            .catch(err => console.error(err));
    }, [memberId]);

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
                            notifications={notifications}
                            deletedNotificationIds={deletedNotificationIds}
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