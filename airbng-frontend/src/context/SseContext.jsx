

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
                    console.log('[SSE Context] 저장된 알림 불러오기 성공:', parsedAlarms.length + '개');
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
        console.log('[SSE Context] 브라우저 알림 생성 시도:', title, message);

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

                    console.log('[SSE Context] 브라우저 알림 생성 성공');

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
                console.log('[SSE Context] 알림 권한 요청 중...');
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        // 권한을 받은 후 다시 알림 시도
                        const notification = new Notification(title, {
                            body: message,
                            icon: options.icon || '/favicon.ico',
                            tag: options.tag || 'sse-notification',
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

        console.log('[SSE Context] 전역 알림 리스너 등록');

        const globalAlarmHandler = (data) => {
            console.log('[SSE Context] 전역 알림 수신:', data);

            // 알림 객체에 수신 시간 추가
            const alarmWithTime = {
                ...data,
                receivedAt: formatDateTime(new Date())
            };

            // 전역 알림 상태 업데이트 (모든 페이지에서 공유)
            setAlarms((prevAlarms) => {
                console.log('[SSE Context] 이전 알림 개수:', prevAlarms.length);
                const newAlarms = [alarmWithTime, ...prevAlarms].slice(0, 100);
                console.log('[SSE Context] 업데이트된 알림 개수:', newAlarms.length);
                return newAlarms;
            });

            // 브라우저 알림 표시 (모든 페이지에서)
            showNotification('예약 알림', data.message);
        };

        // 전역 리스너 등록
        sseManager.addEventListener('alarm', globalAlarmHandler);
        globalListenerRef.current = globalAlarmHandler;

        return () => {
            if (globalListenerRef.current) {
                console.log('[SSE Context] 전역 알림 리스너 제거');
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
        alarms,
        setAlarms,
        requestNotificationPermission,
        showNotification,

        // 개별 컴포넌트용 구독 (선택사항)
        subscribeToAlarms: useCallback((callback) => {
            console.log('[SSE Context] 개별 알림 구독 추가');

            const wrappedCallback = (data) => {
                if (callback && typeof callback === 'function') {
                    try {
                        const alarmWithTime = {
                            ...data,
                            receivedAt: formatDateTime(new Date())
                        };
                        callback(alarmWithTime);
                    } catch (error) {
                        console.error('[SSE Context] 개별 콜백 실행 오류:', error);
                    }
                }
            };

            sseManager.addEventListener('alarm', wrappedCallback);

            return () => {
                console.log('[SSE Context] 개별 알림 구독 제거');
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

// 개별 컴포넌트에서 알림을 쉽게 구독할 수 있는 Hook (선택사항)
export const useAlarmSubscription = (callback, dependencies = []) => {
    const { subscribeToAlarms } = useSSE();

    React.useEffect(() => {
        if (callback && typeof callback === 'function') {
            console.log('[SSE Hook] useAlarmSubscription 구독 시작');
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

// App.jsx에서 사용할 수 있는 전역 SSE 설정 컴포넌트
export const SSEConnectionIndicator = () => {
    const { isConnected, isConnecting, connectionError } = useSSE();

    return (
        <div
            id="connectionIndicator"
            className={`connection-indicator ${isConnected ? 'connected' : ''}`}
            data-status={isConnected ? '실시간 알림 연결됨' : '연결 끊김'}
            title={connectionError || (isConnecting ? '연결 중...' : (isConnected ? '실시간 알림 연결됨' : '연결 끊김'))}
        >
            <span className="status-dot"></span>
            {isConnecting ? '연결 중' : (isConnected ? '온라인' : '오프라인')}

            <style jsx>{`
                .connection-indicator {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    background-color: #f8f9fa;
                    border: 1px solid #dee2e6;
                    color: #6c757d;
                    z-index: 1000;
                    transition: all 0.3s ease;
                }
                
                .connection-indicator.connected {
                    background-color: #d1f2eb;
                    border-color: #7dcea0;
                    color: #186a3b;
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: #dc3545;
                    animation: pulse-offline 2s infinite;
                }
                
                .connection-indicator.connected .status-dot {
                    background-color: #28a745;
                    animation: pulse-online 2s infinite;
                }
                
                @keyframes pulse-online {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                @keyframes pulse-offline {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
};