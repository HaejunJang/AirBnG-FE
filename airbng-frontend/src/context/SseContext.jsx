
import React, {createContext, useContext, useCallback, useRef, useState, useEffect} from 'react';
import { useSSEManager } from '../hooks/useSSEManager';

// SSE Context 생성
const SseContext = createContext(null);

// SSE Provider 컴포넌트
export const SSEProvider = ({ children, memberId }) => {
    const sseManager = useSSEManager(memberId);
    const callbackRefMap = useRef(new Map()); // 콜백 참조 저장
    const [alarms, setAlarms] = useState([]); // 알림 저장소

    const STORAGE_KEY = `airbng_alarms_${memberId}`;

    // LocalStorage에서 알림 불러오기
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setAlarms(JSON.parse(saved));
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, [STORAGE_KEY]);

    // alarms가 바뀔 때마다 LocalStorage에 저장
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
    }, [alarms, STORAGE_KEY]);


    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then((permission) => {
                    console.log('[SSE Context] Notification 권한 상태:', permission);
                });
            } else {
                console.log('[SSE Context] 이미 권한 상태:', Notification.permission);
            }
        }
    }, []);


    // 알림 권한 요청 메서드 추가
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
        alarms, // NotificationPage에서 읽을 수 있음
        setAlarms,
        requestNotificationPermission,

        subscribeToAlarms: useCallback((callback) => {
            console.log('[SSE Context] 알림 구독 추가');

            // 실제 리스너 함수 생성 (클로저로 callback을 감싼다)
            const wrappedCallback = (data) => {
                // 알림 ID만 LocalStorage에 저장
                setAlarms((prev) => {
                    const newIds = [data.id, ...prev.filter(id => id !== data.id)];
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
                    return newIds;
                });

                console.log('[DEBUG] subscribeToAlarms 수신 데이터:', data);
                // 전역 브라우저 알림
                sseManager.showNotification('예약 알림', data.message);

                callback?.(data);
            };



                // wrappedCallback을 저장해서 나중에 제거할 수 있도록 함
            callbackRefMap.current.set(callback, wrappedCallback);

            // 실제 이벤트 리스너 등록
            sseManager.addEventListener('alarm', wrappedCallback);

            // 구독 해제 함수 반환
            return () => {
                console.log('[SSE Context] 알림 구독 제거');
                const storedCallback = callbackRefMap.current.get(callback);
                if (storedCallback) {
                    sseManager.removeEventListener('alarm', storedCallback);
                    callbackRefMap.current.delete(callback);
                }
            };
        }, [sseManager]),

        showNotification: useCallback((title, message, options = {}) => {
            console.log('[SSE Context] 브라우저 알림 생성:', title, message);
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(title, {
                    body: message,
                    icon: options.icon || '/favicon.ico',
                    tag: options.tag || 'sse-notification',
                    ...options
                });
                console.log('[DEBUG] 생성된 알림 객체:', notification);

                if (options.autoClose !== false) {
                    setTimeout(() => notification.close(), options.duration || 5000);
                }

                return notification;
            } else {
                console.warn('[SSE Context] 브라우저 알림 권한이 없거나 지원하지 않음');
            }
            return null;
        }, [])
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
        // 권한이 없으면 자동으로 요청
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