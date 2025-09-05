import React, { createContext, useContext, useCallback } from 'react';
import { useSSEManager } from './useSSEManager';

// SSE Context 생성
const SseContext = createContext(null);

// SSE Provider 컴포넌트
export const SSEProvider = ({ children, memberId }) => {
    const sseManager = useSSEManager(memberId);

    const contextValue = {
        ...sseManager,
        // 추가적인 헬퍼 메서드들
        subscribeToAlarms: useCallback((callback) => {
            sseManager.addEventListener('alarm', callback);
            return () => sseManager.removeEventListener('alarm', callback);
        }, [sseManager]),

        showNotification: useCallback((title, message, options = {}) => {
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(title, {
                    body: message,
                    icon: options.icon || '/favicon.ico',
                    tag: options.tag || 'sse-notification',
                    ...options
                });

                if (options.autoClose !== false) {
                    setTimeout(() => notification.close(), options.duration || 5000);
                }

                return notification;
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
                console.warn('알림 권한이 거부되었습니다.');
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