import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 입력 타이핑 이벤트 전송 컴포넌트
 * - 타이핑 true를 쓰로틀링(중복 전송 방지)
 * - 입력 멈추면 일정 시간 후 false 자동 전송(아이들 타이머)
 * - 전송/blur 시 즉시 false
 */
const IDLE_MS = 1500;   // 입력 멈추고 1.5s 후 typing:false
const THROTTLE_MS = 800; // typing:true 과다 송신 방지

export default function ChatInput({ onSend, onTyping }) {
  const [text, setText] = useState('');
  const idleTimerRef = useRef(null);
  const lastTrueAtRef = useRef(0);

  const emitTypingTrue = useCallback(() => {
    const now = Date.now();
    if (now - lastTrueAtRef.current >= THROTTLE_MS) {
      console.log('[TYPING SEND]', { typing: true, at: new Date().toISOString() });
      onTyping?.(true);
      lastTrueAtRef.current = now;
    }
  }, [onTyping]);

  const emitTypingFalse = useCallback(() => {
    console.log('[TYPING SEND]', { typing: false, at: new Date().toISOString() });
    onTyping?.(false);
  }, [onTyping]);

  const scheduleIdle = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      emitTypingFalse();
    }, IDLE_MS);
  }, [emitTypingFalse]);

  const handleChange = (e) => {
    setText(e.target.value);
    emitTypingTrue();
    scheduleIdle();
  };

  const send = useCallback(() => {
    const t = text.trim();
    if (!t) return;
    onSend?.(t);
    setText('');
    clearTimeout(idleTimerRef.current);
    emitTypingFalse(); // 전송 즉시 false
  }, [text, onSend, emitTypingFalse]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleBlur = () => {
    clearTimeout(idleTimerRef.current);
    emitTypingFalse();
  };

  useEffect(() => () => clearTimeout(idleTimerRef.current), []);

  return (
    <div className="chat-input">
      <input
        className="chat-input__field input"
        placeholder="메시지를 입력하세요…"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
      <button className="chat-input__send" onClick={send} aria-label="전송">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12l15-7-4 7 4 7-15-7z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  );
}
