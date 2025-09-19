import React from 'react';
import styles from '../../styles/modal/Modal.module.css';

const Modal = ({
                   isOpen,
                   onClose,
                   onConfirm, // 확인 버튼 클릭 시 실행할 함수
                   title,
                   message,
                   type = 'success', // 'success', 'error', 'question'
                   icon,
                   buttonText = '확인',
                   cancelButtonText = '취소',
                   showCancelButton = false // question 타입에서 취소 버튼 표시 여부
               }) => {
    if (!isOpen) return null;

    // 타입에 따른 기본값 설정
    const getDefaults = () => {
        if (type === 'error') {
            return {
                defaultTitle: title || '오류',
                defaultIcon: icon || '!',
                defaultMessage: message || '처리 중 오류가 발생했습니다.'
            };
        } else if (type === 'question') {
            return {
                defaultTitle: title || '확인',
                defaultIcon: icon || '?',
                defaultMessage: message || '계속하시겠습니까?'
            };
        } else {
            return {
                defaultTitle: title || '성공!',
                defaultIcon: icon || '✓',
                defaultMessage: message || '작업이 완료되었습니다.'
            };
        }
    };

    const { defaultTitle, defaultIcon, defaultMessage } = getDefaults();

    // 아이콘 클래스 결정
    const getIconClass = () => {
        switch(type) {
            case 'success':
                return styles.successRotate;
            case 'error':
                return styles.errorShake;
            case 'question':
                return styles.questionBounce;
            default:
                return '';
        }
    };

    // 확인 버튼 클릭 핸들러
    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            onClose();
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalContent}>
                    <div className={`${styles.modalIcon} ${getIconClass()}`}>
                        {defaultIcon}
                    </div>
                    <h3 className={styles.modalTitle}>{defaultTitle}</h3>
                    <p className={styles.modalMessage}>{defaultMessage}</p>
                </div>
                <div className={`${styles.modalButtons} ${(type === 'question' || showCancelButton) ? styles.twoButtons : ''}`}>
                    {(type === 'question' || showCancelButton) && (
                        <button
                            className={`${styles.modalBtn} ${styles.cancel}`}
                            onClick={onClose}
                        >
                            {cancelButtonText}
                        </button>
                    )}
                    <button
                        className={`${styles.modalBtn} ${(type === 'question' || showCancelButton) ? styles.confirm : ''}`}
                        onClick={handleConfirm}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;