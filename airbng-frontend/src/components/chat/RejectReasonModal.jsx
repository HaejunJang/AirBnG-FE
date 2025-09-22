import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function RejectReasonModal({ open, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (open) setReason(''); }, [open]);
  if (!open) return null;

  const submit = () => {
    const v = reason.trim();
    if (!v) return alert('거절 사유를 입력해주세요.');
    onSubmit?.(v);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
    if (e.key === 'Escape') onClose?.();
  };

  const modal = (
    <div
      className="rj-backdrop"
      onClick={(e) => {
        // 배경 자체를 클릭했을 때만 닫기 (자식 클릭 버블링 보호)
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="rj-modal" onClick={(e) => e.stopPropagation()}>
        <h3>거절 사유</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={onKeyDown}
          rows={4}
          placeholder="예) 영업시간 외 요청입니다."
          maxLength={500}
          autoFocus
        />
        <div className="rj-actions">
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn--danger" onClick={submit}>거절 확정</button>
        </div>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}
