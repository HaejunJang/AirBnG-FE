import React, {createContext, useContext, useCallback, useRef, useState, useEffect} from 'react';
import { useSSEManager } from '../hooks/useSSEManager';


// SSE Context 생성
const SseContext = createContext(null);

// SSE Provider 컴포넌트
export const SSEProvider = ({ children, memberId }) => {
    const sseManager = useSSEManager(memberId);
    const [alarms, setAlarms] = useState([]); // 전체 알림 객체 저장소
    const globalListenerRef = useRef(null); // 전역 리스너 참조

    const STORAGE_KEY = `airbng_alarms_${memberId}`;

    // 시간 포맷팅 함수
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

    // LocalStorage에서 알림 불러오기
    useEffect(() => {
        if (!memberId) return;

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsedAlarms = JSON.parse(saved);
                if (Array.isArray(parsedAlarms)) {
                    setAlarms(parsedAlarms);
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                    setAlarms([]);
                }
            } catch (error) {
                console.error('[SSE Context] 알림 로딩 실패:', error);
                localStorage.removeItem(STORAGE_KEY);
                setAlarms([]);
            }
        }
    }, [STORAGE_KEY, memberId]);

    // alarms가 바뀔 때마다 LocalStorage에 저장
    useEffect(() => {
        if (!memberId) return;

        if (alarms.length >= 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
            console.log('[SSE Context] 알림 저장 완료:', alarms.length + '개');
        }
    }, [alarms, STORAGE_KEY, memberId]);

    // 브라우저 알림 권한 요청
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then((permission) => {
                    console.log('[SSE Context] Notification 권한 상태:', permission);
                });
            }
        }
    }, []);

    // 브라우저 알림 표시 함수
    const showNotification = useCallback((title, message, options = {}) => {

        if (typeof window !== 'undefined' && 'Notification' in window) {
            console.log('[SSE Context] 현재 알림 권한:', Notification.permission);

            if (Notification.permission === 'granted') {
                try {
                    const notification = new Notification(title, {
                        body: message,
                        icon: options.icon || '/favicon.ico',
                        tag: options.tag || 'sse-notification',
                        requireInteraction: false,
                        ...options
                    });

                    if (options.autoClose !== false) {
                        setTimeout(() => {
                            try {
                                notification.close();
                            } catch (e) {
                                // 이미 닫힌 경우 무시
                            }
                        }, options.duration || 5000);
                    }

                    return notification;
                } catch (error) {
                    console.error('[SSE Context] 브라우저 알림 생성 실패:', error);
                }
            } else if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        // 권한을 받은 후 다시 알림 시도
                        const notification = new Notification(title, {
                            body: message,
                            icon: options.icon || '/favicon.ico',
                            tag: options.tag || 'sse-notification-${Date.now()}',
                            ...options
                        });

                        if (options.autoClose !== false) {
                            setTimeout(() => {
                                try {
                                    notification.close();
                                } catch (e) {
                                    // 이미 닫힌 경우 무시
                                }
                            }, options.duration || 5000);
                        }
                    }
                });
            } else {
                console.warn('[SSE Context] 브라우저 알림 권한이 거부됨');
            }
        }
        return null;
    }, []);

    // 전역 알림 핸들러 등록 (SSE 연결 후)
    useEffect(() => {
        if (!sseManager.isConnected || !memberId || globalListenerRef.current) return;

        const globalAlarmHandler = (data) => {
            console.log('[SSE Context] 전역 알림 수신:', data);

            // 알림 객체에 수신 시간 추가
            const alarmWithTime = {
                ...data,
                receivedAt: formatDateTime(new Date())
            };

            // 전역 알림 상태 업데이트 (모든 페이지에서 공유)
            setAlarms((prevAlarms) => {
                const newAlarms = [alarmWithTime, ...prevAlarms].slice(0, 100);
                console.log('[SSE Context] 업데이트된 알림 개수:', newAlarms.length);
                return newAlarms;
            });

            // 브라우저 알림 표시 (모든 페이지에서)
            showNotification('AirBnG 알림', data.message);

            //dot을 위한 이벤트
            window.dispatchEvent(
                new CustomEvent('newAlarmReceived', { detail: data })
            );
        };

        // 전역 리스너 등록
        sseManager.addEventListener('alarm', globalAlarmHandler);
        globalListenerRef.current = globalAlarmHandler;

        return () => {
            if (globalListenerRef.current) {
                sseManager.removeEventListener('alarm', globalListenerRef.current);
                globalListenerRef.current = null;
            }
        };
    }, [sseManager.isConnected, sseManager, memberId, formatDateTime, showNotification]);

    // 알림 권한 요청 메서드
    const requestNotificationPermission = useCallback(async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                console.log('[SSE Context] 권한 요청 결과:', permission);
                return permission;
            }
            return Notification.permission;
        }
        return 'denied';
    }, []);

    const contextValue = {
        ...sseManager,
        memberId,
        alarms,
        setAlarms,
        requestNotificationPermission,
        showNotification,

        // 개별 컴포넌트용 구독
        subscribeToAlarms: useCallback((callback) => {

            const wrappedCallback = (data) => {
                if (callback && typeof callback === 'function') {
                    try {
                        const alarmWithTime = {
                            ...data,
                            receivedAt: formatDateTime(new Date())
                        };
                        callback(alarmWithTime);
                    } catch (error) {
                    }
                }
            };

            sseManager.addEventListener('alarm', wrappedCallback);

            return () => {
                sseManager.removeEventListener('alarm', wrappedCallback);
            };
        }, [sseManager, formatDateTime])
    };

    return (
        <SseContext.Provider value={contextValue}>
            {children}
        </SseContext.Provider>
    );
};

// SSE Context Hook
export const useSSE = () => {
    const context = useContext(SseContext);
    if (!context) {
        throw new Error('useSSE must be used within an SSEProvider');
    }
    return context;
};

// 개별 컴포넌트에서 알림을 쉽게 구독할 수 있는 Hook
export const useAlarmSubscription = (callback, dependencies = []) => {
    const { subscribeToAlarms } = useSSE();

    React.useEffect(() => {
        if (callback && typeof callback === 'function') {
            const unsubscribe = subscribeToAlarms(callback);
            return unsubscribe;
        }
    }, [...dependencies, subscribeToAlarms]);
};

// 간단한 알림 표시를 위한 Hook
export const useNotification = () => {
    const { showNotification, requestNotificationPermission } = useSSE();

    const notify = useCallback(async (title, message, options = {}) => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            const permission = await requestNotificationPermission();
            if (permission !== 'granted') {
                console.warn('[SSE Hook] 알림 권한이 거부되었습니다.');
                return null;
            }
        }

        return showNotification(title, message, options);
    }, [showNotification, requestNotificationPermission]);

    return { notify, requestNotificationPermission };
};

