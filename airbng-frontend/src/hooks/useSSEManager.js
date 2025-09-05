import { useState, useEffect, useRef, useCallback } from 'react';

export const useSSEManager = (memberId = null) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState(null);

    const eventSourceRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const listenersRef = useRef(new Map());
    const connectionStatusCallbacksRef = useRef([]);
    const isInitializedRef = useRef(false);
    const maxReconnectAttempts = 5;

    // memberId 자동 감지
    const resolvedMemberId = memberId ||
        (typeof window !== 'undefined' && (
            window.memberId ||
            document?.body?.dataset?.memberId
        ));

    // 연결 상태 업데이트
    const updateConnectionStatus = useCallback((connected, error = null) => {
        setIsConnected(connected);
        setConnectionError(error);

        // DOM 업데이트 (기존 코드와 호환성을 위해)
        if (typeof document !== 'undefined') {
            const indicator = document.getElementById('connectionIndicator');
            if (indicator) {
                indicator.className = connected ? 'connection-indicator connected' : 'connection-indicator';
                indicator.setAttribute('data-status', connected ? '실시간 알림 연결됨' : '연결 끊김');
            }
        }

        // 콜백 실행
        connectionStatusCallbacksRef.current.forEach(callback => {
            try {
                callback(connected);
            } catch (error) {
                console.error('연결 상태 콜백 오류:', error);
            }
        });
    }, []);

    // 알림 이벤트 처리
    const handleAlarmEvent = useCallback((alarmData) => {
        const alarmListeners = listenersRef.current.get('alarm') || [];
        alarmListeners.forEach(listener => {
            try {
                listener(alarmData);
            } catch (error) {
                console.error('알림 리스너 실행 오류:', error);
            }
        });
    }, []);

    // 재연결 시도
    const attemptReconnect = useCallback(() => {
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            reconnectAttemptsRef.current++;

            setTimeout(() => {
                if (!isConnected) {
                    console.log(`재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
                    disconnect();
                    connect();
                }
            }, delay);
        } else {
            console.error('최대 재연결 시도 횟수 초과');
            updateConnectionStatus(false, '최대 재연결 시도 횟수 초과');
        }
    }, [isConnected]);

    // 연결
    const connect = useCallback(() => {
        if (isConnected || isConnecting || !resolvedMemberId) return;

        setIsConnecting(true);
        setConnectionError(null);

        try {
            eventSourceRef.current = new EventSource(`/AirBnG/alarms/reservations/alarms`);

            eventSourceRef.current.addEventListener('connect', (event) => {
                console.log('SSE 연결 성공:', event.data);
                updateConnectionStatus(true);
                reconnectAttemptsRef.current = 0;
                setIsConnecting(false);
            });

            eventSourceRef.current.addEventListener('alarm', (event) => {
                try {
                    const alarmData = JSON.parse(event.data);
                    console.log('알림 수신:', alarmData);
                    handleAlarmEvent(alarmData);
                } catch (e) {
                    console.error('알림 데이터 파싱 오류:', e);
                }
            });

            eventSourceRef.current.onopen = () => {
                console.log('SSE 연결 열림');
                updateConnectionStatus(true);
                reconnectAttemptsRef.current = 0;
                setIsConnecting(false);
            };

            eventSourceRef.current.onerror = (error) => {
                console.error('SSE 연결 오류:', error);
                updateConnectionStatus(false, 'SSE 연결 오류');
                setIsConnecting(false);
                attemptReconnect();
            };

        } catch (error) {
            console.error('SSE 연결 설정 오류:', error);
            updateConnectionStatus(false, 'SSE 연결 설정 오류');
            setIsConnecting(false);
        }
    }, [isConnected, isConnecting, resolvedMemberId, updateConnectionStatus, handleAlarmEvent, attemptReconnect]);

    // 연결 해제
    const disconnect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        updateConnectionStatus(false);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
    }, [updateConnectionStatus]);

    // 이벤트 리스너 추가
    const addEventListener = useCallback((eventType, callback) => {
        if (!listenersRef.current.has(eventType)) {
            listenersRef.current.set(eventType, []);
        }
        const callbacks = listenersRef.current.get(eventType);
        if (!callbacks.includes(callback)) {
            callbacks.push(callback);
        }
    }, []);

    // 이벤트 리스너 제거
    const removeEventListener = useCallback((eventType, callback) => {
        if (listenersRef.current.has(eventType)) {
            const listeners = listenersRef.current.get(eventType);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }, []);

    // 연결 상태 변경 콜백 추가
    const onConnectionStatusChange = useCallback((callback) => {
        connectionStatusCallbacksRef.current.push(callback);
    }, []);

    // 브라우저 알림 권한 요청
    const requestNotificationPermission = useCallback(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            return Notification.requestPermission();
        }
        return Promise.resolve(typeof window !== 'undefined' ? Notification.permission : 'denied');
    }, []);

    // 초기화 및 자동 연결
    useEffect(() => {
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        // 브라우저 알림 권한 요청
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('브라우저 알림 권한:', permission);
            });
        }

        // 로그인된 사용자만 연결
        if (resolvedMemberId && resolvedMemberId !== 'null' && resolvedMemberId !== '') {
            connect();
        } else {
            console.warn('SSE 비활성화: 로그인하지 않은 사용자');
        }
    }, [resolvedMemberId, connect]);

    // 탭 재활성화 시 자동 재연결
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && !isConnected && resolvedMemberId) {
                connect();
            }
        };

        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }, [isConnected, resolvedMemberId, connect]);

    // 컴포넌트 언마운트 시 연결 해제
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        // 상태
        isConnected,
        isConnecting,
        connectionError,
        memberId: resolvedMemberId,

        // 메서드
        connect,
        disconnect,
        addEventListener,
        removeEventListener,
        onConnectionStatusChange,
        requestNotificationPermission
    };
};