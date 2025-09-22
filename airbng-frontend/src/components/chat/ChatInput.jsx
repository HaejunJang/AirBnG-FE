import { useCallback, useEffect, useRef, useState } from "react";
import uploadIcon from "../../assets/img_upload_ic.svg";

const IDLE_MS = 1500;
const THROTTLE_MS = 800;

export default function ChatInput({ onSend, onTyping, onAttach }) {
  const [text, setText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const idleTimerRef = useRef(null);
  const lastTrueAtRef = useRef(0);
  const fileRef = useRef(null);

  const emitTypingTrue = useCallback(() => {
    const now = Date.now();
    if (now - lastTrueAtRef.current >= THROTTLE_MS) {
      onTyping?.(true);
      lastTrueAtRef.current = now;
    }
  }, [onTyping]);

  const emitTypingFalse = useCallback(() => {
    onTyping?.(false);
  }, [onTyping]);

  const scheduleIdle = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => emitTypingFalse(), IDLE_MS);
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
    setText("");
    clearTimeout(idleTimerRef.current);
    emitTypingFalse();
  }, [text, onSend, emitTypingFalse]);

  const handleKeyDown = (e) => {
    // 한글 입력 중일 때는 Enter 무시
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      send();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleBlur = () => {
    clearTimeout(idleTimerRef.current);
    emitTypingFalse();
  };

  // --- 첨부 ---
  const openPicker = () => fileRef.current?.click();
  const onFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onAttach?.(files);
    e.target.value = ""; // 같은 파일 재선택 허용
  };

  // 붙여넣기 이미지/파일
  useEffect(() => {
    const onPaste = (e) => {
      const files = Array.from(e.clipboardData?.files || []);
      if (files.length) onAttach?.(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onAttach]);

  // 드래그 앤 드롭
  useEffect(() => {
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDrop = (e) => {
      prevent(e);
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) onAttach?.(files);
    };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", onDrop);
    };
  }, [onAttach]);

  useEffect(() => () => clearTimeout(idleTimerRef.current), []);

  return (
    <div className="chat-input">
      <button
        className="chat-input__attach"
        onClick={openPicker}
        aria-label="첨부"
      >
        <img src={uploadIcon} alt="" />
      </button>
      <input
        ref={fileRef}
        type="file"
        multiple
        onChange={onFileChange}
        hidden
      />
      <input
        className="chat-input__field input"
        placeholder="메시지를 입력하세요…"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={handleBlur}
      />
      <button className="chat-input__send" onClick={send} aria-label="전송">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12l15-7-4 7 4 7-15-7z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
