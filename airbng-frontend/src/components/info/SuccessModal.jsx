import React from 'react';
import info from '../../styles/pages/myInfo.module.css';

const SuccessModal = ({ isOpen, onClose, title = '수정 완료!', message = '정보가 성공적으로 수정되었습니다.' }) => {
    if (!isOpen) return null;

    return (
        <div className={info.modalOverlay}>
            <div className={info.modal}>
                <div className={info.modalContent}>
                    <div className={`${info.modalIcon} ${info.successRotate}`}>✓</div>
                    <h3 className={info.modalTitle}>{title}</h3>
                    <p className={info.modalMessage}>{message}</p>
                </div>
                <div className={info.modalButtons}>
                    <button className={info.modalBtn} onClick={onClose}>
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;