import { useEffect, useRef, useState } from 'react';

export default function ChatInput({ onSend, onTyping }) {
  const [text, setText] = useState('');
  const typingTimer = useRef(null);

  const emitTyping = (typing) => onTyping && onTyping(typing);

  const handleChange = (e) => {
    setText(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 800);
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSend?.(t);
    setText('');
    emitTyping(false);
  };

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  return (
    <div className="chat-input">
      <input
        className="chat-input__field input"
        placeholder="메시지를 입력하세요…"
        value={text}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
        }}
      />
      <button className="chat-input__send" onClick={send}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12l15-7-4 7 4 7-15-7z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  );
}