import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Modal, useModal } from '../common/ModalUtil';

export default function RejectReasonModal({ open, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const modal = useModal();

  useEffect(() => { if (open) setReason(''); }, [open]);
  if (!open) return null;

  const submit = () => {
    const v = reason.trim();
    if (!v) {
      modal.showError('입력 필요', '거절 사유를 입력해주세요.');
      return;
    }
    onSubmit?.(v);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
    if (e.key === 'Escape') onClose?.();
  };

  const modalContent = (
    <div
      className="rj-backdrop"
      onClick={(e) => {
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
      {/* 모달 에러 메시지 */}
      <Modal {...modal.modalState} onClose={modal.hideModal} />
    </div>
  );
  return createPortal(modalContent, document.body);
}
