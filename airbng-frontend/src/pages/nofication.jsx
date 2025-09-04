import React, { useState, useEffect, useCallback } from 'react';
import { getNotification } from '../api/notification'; // 아까 작성한 axios 호출
import '../styles/pages/notification.css';

// SSE Manager Mock (실제 구현 시 외부 파일로 분리)
const getSSEManager = () => ({
    addEventListener: (event, callback) => {
        // 실제 SSE 구현
    },
    init: () => {
        // SSE 초기화
    }
});

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
    const [sseManager, setSseManager] = useState(null);

    // 알림의 고유 키 생성
    const getAlarmKey = useCallback((alarmData) => {
        return `${alarmData.id}|${alarmData.message}|${alarmData.type}|${alarmData.reservationId}`;
    }, []);

    // 날짜 포맷팅
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

    // 로컬 스토리지 저장
    const saveToStorage = useCallback(() => {
        if (!memberId) return;

        const notificationsJson = JSON.stringify(notifications);
        const deletedJson = JSON.stringify([...deletedNotificationIds.entries()]);

        try {
            localStorage.setItem(`alarmHistory_${memberId}`, notificationsJson);
            localStorage.setItem(`deletedAlarms_${memberId}`, deletedJson);
        } catch (error) {
            console.error('저장 실패:', error);
        }
    }, [memberId, notifications, deletedNotificationIds]);

    // 로컬 스토리지 로드
    const loadFromStorage = useCallback(() => {
        if (!memberId) return;

        try {
            // 삭제된 알림 기록 로드
            const deletedData = localStorage.getItem(`deletedAlarms_${memberId}`);
            if (deletedData) {
                const deletedArray = JSON.parse(deletedData);
                setDeletedNotificationIds(new Map(deletedArray));
            }

            // 알림 목록 로드
            const notificationsData = localStorage.getItem(`alarmHistory_${memberId}`);
            if (notificationsData) {
                const savedNotifications = JSON.parse(notificationsData);
                const now = Date.now();

                const filteredNotifications = savedNotifications
                    .filter(n => {
                        const alarmKey = getAlarmKey(n);
                        const deletedAt = deletedNotificationIds.get(alarmKey);
                        return !(deletedAt && (now - deletedAt < 23 * 60 * 60 * 1000));
                    })
                    .map(n => {
                        if (n.receivedAt && n.receivedAt.includes('.')) {
                            const date = new Date(n.receivedAt.replace(/\./g, '-').replace(' ', 'T'));
                            if (!isNaN(date.getTime())) {
                                n.receivedAt = formatDateTime(date);
                            }
                        }
                        return n;
                    });

                setNotifications(filteredNotifications);
            }
        } catch (error) {
            console.error('로드 실패:', error);
            setNotifications([]);
            setDeletedNotificationIds(new Map());
        }
    }, [memberId, getAlarmKey, formatDateTime, deletedNotificationIds]);

    // 만료된 삭제 기록 정리
    const cleanExpiredDeletions = useCallback(() => {
        const now = Date.now();
        setDeletedNotificationIds(prevDeleted => {
            const newDeleted = new Map();
            for (const [key, deletedAt] of prevDeleted.entries()) {
                if (now - deletedAt <= 23 * 60 * 60 * 1000) {
                    newDeleted.set(key, deletedAt);
                }
            }
            return newDeleted;
        });
    }, []);

    // 브라우저 알림 표시
    const showBrowserNotification = useCallback((alarmData) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('새 알림', {
                body: alarmData.message,
                icon: '/images/favicon.svg'
            });
            setTimeout(() => notification.close(), 5000);
        }
    }, []);

    // 새 알림 추가 버튼 (데모용)
    const addDemoNotification = () => {
        const demoNotifications = [
            {
                id: `n${Date.now()}`,
                message: '새로운 예약 요청이 도착했습니다.',
                type: 'STATE_CHANGE',
                reservationId: `RES${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                nickName: '홍길동',
                receivedAt: formatDateTime(new Date())
            },
            {
                id: `n${Date.now() + 1}`,
                message: '10분 후 예약이 시작됩니다.',
                type: 'REMINDER',
                reservationId: `RES${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                nickName: '강감찬',
                receivedAt: formatDateTime(new Date())
            }
        ];

        const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
        handleNotification(randomNotification);
    };

    const handleNotification = useCallback((alarmData) => {
        const now = Date.now();
        const alarmKey = getAlarmKey(alarmData);

        // 삭제 기록 확인
        const deletedAt = deletedNotificationIds.get(alarmKey);
        if (deletedAt && (now - deletedAt) < 23 * 60 * 60 * 1000) return;

        // 중복 확인
        const isDuplicate = notifications.some(n => getAlarmKey(n) === alarmKey);
        if (isDuplicate) return;

        const newNotification = {
            ...alarmData,
            receivedAt: formatDateTime(new Date())
        };

        setNotifications(prev => {
            const updated = [newNotification, ...prev];
            return updated.length > 50 ? updated.slice(0, 50) : updated;
        });

        showBrowserNotification(alarmData);
    }, [notifications, deletedNotificationIds, getAlarmKey, formatDateTime, showBrowserNotification]);

    // 개별 알림 삭제
    const removeNotification = useCallback((id, message, type, reservationId) => {
        const key = `${id}|${message}|${type}|${reservationId}`;
        setNotifications(prev => prev.filter(n => getAlarmKey(n) !== key));
        setDeletedNotificationIds(prev => new Map(prev).set(key, Date.now()));
    }, [getAlarmKey]);

    // 전체 알림 삭제
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

    // SSE 초기화
    useEffect(() => {
        if (!memberId) return;

        const manager = getSSEManager();
        manager.addEventListener('alarm', handleNotification);
        manager.init();
        setSseManager(manager);

        return () => {
            // 정리 작업
        };
    }, [memberId, handleNotification]);

    // 컴포넌트 마운트 시 초기화
    // useEffect(() => {
    //     if (!memberId) {
    //         console.warn('알림 기능 비활성화: 로그인하지 않은 사용자');
    //         return;
    //     }
    //
    //     loadFromStorage();
    //     cleanExpiredDeletions();
    // }, [memberId, loadFromStorage, cleanExpiredDeletions]);
    useEffect(() => {
        if (!memberId) return;

        // 서버에 알림 읽음 처리 요청
        getNotification()
            .then(() => {
                console.log(`서버에서 알림 읽음 처리 완료 (memberId=${memberId})`);
                // 필요한 경우, 서버에서 받은 알림 데이터를 setNotifications로 상태에 반영 가능
            })
            .catch(err => console.error(err));
    }, [memberId]);

    // 데이터 변경 시 저장
    useEffect(() => {
        saveToStorage();
    }, [saveToStorage]);

    return (
        <div className="app-container">
            <div className="app-content">
                <div className="main-content">
                    <Header
                        title="알림"
                        showBackButton={true}
                        backUrl="/page/home"
                    />

                    {/* 데모용 새 알림 추가 버튼 */}
                    <div className="demo-section">
                        <button
                            onClick={addDemoNotification}
                            className="demo-button"
                        >
                            🔔 새 알림 받기 (데모)
                        </button>
                        <span className="demo-text">
              실제 서비스에서는 SSE를 통해 자동으로 알림이 옵니다
            </span>
                    </div>

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