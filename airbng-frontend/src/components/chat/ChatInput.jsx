import { useEffect, useRef, useState } from 'react';

export default function ChatInput({ onSend, onTyping }) {
  const [text, setText] = useState('');
  const typingTimer = useRef(null);

  const emitTyping = (typing) => {
    onTyping && onTyping(typing);
  };

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
    <div className="d-flex gap-2 p-2 border-top">
      <input
        className="form-control"
        placeholder="메시지를 입력하세요…"
        value={text}
        onChange={handleChange}
        onKeyDown={(e)=> { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
      />
      <button className="btn btn-primary" onClick={send}>전송</button>
    </div>
  );
}
