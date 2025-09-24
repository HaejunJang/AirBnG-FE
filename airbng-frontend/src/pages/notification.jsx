import React, { useState, useCallback, useEffect } from 'react';
import { useSSE } from '../context/SseContext';
import { loadDeletedIds, saveDeletedIds } from '../hooks/useSSEManager';
import {getNotification, hasreadAlarm} from '../api/notification';
import '../styles/pages/notification.css';
import {useDot} from "../hooks/useDot";
import {useNavigate} from "react-router-dom";
import Header from '../components/Header/Header';


// const Header = ({ title, showBackButton, backUrl }) => (
//     <div className="header">
//         {showBackButton && (
//             <button
//                 onClick={() => (window.location.href = backUrl)}
//                 className="notification-back-button"
//             >
//                 ←
//             </button>
//         )}
//         <h1 className="header-title">{title}</h1>
//     </div>
// );

const Welcome = ({ subtitle }) => {
    const navigate = useNavigate(); // 여기서 훅 사용

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
    };
    const classMap = {
        EXPIRED: 'expired',
        REMINDER: 'reminder',
        STATE_CHANGE: 'state-change',
        CANCEL_NOTICE: 'cancel-notice',
    };

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
                    예약번호: {notification.reservationId} | 사용자: {notification.nickName}
                </div>
            </div>
        </div>
    );
};

const NotificationList = ({ notifications, deletedNotificationIds, onRemove, onClearAll }) => {
    // 고유 키 생성 함수 (여러 필드 조합으로 생성)
    const getAlarmKey = (alarm) => {
        // id가 있으면 사용하고, 없으면 다른 필드들로 조합해서 고유키 생성
        if (alarm.id) {
            return `${alarm.id}`;
        }
        // id가 없는 경우 다른 필드들로 고유 키 생성
        return `${alarm.reservationId}-${alarm.receiverId}-${alarm.type}-${alarm.receivedAt}`;
    };

    const TWENTY_THREE_HOURS = 23 * 60 * 60 * 1000;

    // 삭제되지 않았거나 23시간이 지난 알림만 표시
    const visibleNotifications = notifications.filter((notification) => {
        const key = getAlarmKey(notification);
        const deletedTime = deletedNotificationIds.get(key);

        // 삭제되지 않았으면 표시
        if (!deletedTime) {
            return true;
        }

        // 23시간이 지났으면 다시 표시
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
                {visibleNotifications.map((notification, idx) => (
                    <NotificationItem
                        key={`${getAlarmKey(notification)}-${idx}`}
                        notification={notification}
                        onRemove={onRemove}
                    />
                ))}
            </div>
        </>
    );
};

const NotificationApp = () => {

    const { alarms, isConnected, memberId } = useSSE(); // 전역 알림 상태
    const { hideDot } = useDot(memberId); // DOT 상태 관리
    const [deletedRef, setDeletedRef] = useState(() => loadDeletedIds(memberId));

    // 23시간 밀리초
    const TWENTY_THREE_HOURS = 23 * 60 * 60 * 1000;

    // 고유 키 생성 함수 (여러 필드 조합으로 생성)
    const getAlarmKey = useCallback((alarm) => {
        if (!alarm) {
            return null;
        }

        // id가 있으면 사용하고, 없으면 다른 필드들로 조합해서 고유키 생성
        if (alarm.id) {
            return `${alarm.id}`;
        }

        // id가 없는 경우 다른 필드들로 고유 키 생성
        if (alarm.reservationId && alarm.receiverId && alarm.type && alarm.receivedAt) {
            return `${alarm.reservationId}-${alarm.receiverId}-${alarm.type}-${alarm.receivedAt}`;
        }

        return null;
    }, []);

    // 컴포넌트 마운트 시 브라우저 알림 권한 확인
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then((permission) => {
                });
            } else {
                console.log('[NotificationApp] 현재 브라우저 알림 권한:', Notification.permission);
            }
        }
    }, []);

    // 삭제된 알림 목록 정리 (컴포넌트 마운트 시)
    useEffect(() => {
        const now = Date.now();
        setDeletedRef((prev) => {
            const newMap = new Map();
            let cleanedCount = 0;

            // 23시간이 지나지 않은 삭제 기록만 유지
            for (const [key, deletedTime] of prev) {
                if ((now - deletedTime) < TWENTY_THREE_HOURS) {
                    newMap.set(key, deletedTime);
                } else {
                    cleanedCount++;
                }
            }

            // 변경사항이 있으면 저장
            if (cleanedCount > 0) {
                saveDeletedIds(newMap, memberId);
            }

            return newMap;
        });
    }, [TWENTY_THREE_HOURS, memberId]);

    // 개별 알림 삭제
    const removeNotification = useCallback(
        (notification) => {
            if (!notification) {
                return;
            }

            const key = getAlarmKey(notification);
            if (!key) {
                return;
            }

            const now = Date.now();

            setDeletedRef((prevMap) => {
                const newMap = new Map(prevMap);
                newMap.set(key, now);

                try {
                    saveDeletedIds(newMap, memberId);
                } catch (error) {
                }

                return newMap;
            });
        },
        [getAlarmKey, memberId]
    );

    // 모든 알림 삭제
    const clearAllNotifications = useCallback(() => {
        if (!alarms || alarms.length === 0) {;
            return;
        }

        const now = Date.now();

        setDeletedRef((prevMap) => {
            const newMap = new Map(prevMap);
            let newDeletedCount = 0;

            // 현재 보이는 모든 알림을 삭제 처리
            alarms.forEach((notification) => {
                const key = getAlarmKey(notification);
                if (!key) return;

                const existingDeletedTime = prevMap.get(key);

                // 이미 삭제되었지만 23시간이 지난 경우 또는 아직 삭제되지 않은 경우
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

            return newMap;
        });
    }, [alarms, getAlarmKey, TWENTY_THREE_HOURS, memberId]);

    // 알림 페이지 진입 시 읽음 처리
    useEffect(() => {
        if (!memberId) return;

        const handleAlarm = async (event) => {
            const receiverId = String(event.detail?.receiverId);
            const myId = String(memberId);

            // 내가 받은 알림이고, 현재 알림 페이지면 → 즉시 읽음 처리
            if (receiverId === myId && window.location.pathname === '/page/notification') {
                try {
                    await hasreadAlarm();  // 서버 읽음 처리
                    hideDot();             // dot 숨김
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
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationApp;