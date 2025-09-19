import React from 'react';
import styles from '../../styles/modal/Modal.module.css';

const Modal = ({
                   isOpen,
                   onClose,
                   title,
                   message,
                   type = 'success', // 'success' 또는 'error'
                   icon,
                   buttonText = '확인'
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
        } else {
            return {
                defaultTitle: title || '성공!',
                defaultIcon: icon || '✓',
                defaultMessage: message || '작업이 완료되었습니다.'
            };
        }
    };

    const { defaultTitle, defaultIcon, defaultMessage } = getDefaults();

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalContent}>
                    <div className={`${styles.modalIcon} ${
                        type === 'success' ? styles.successRotate :
                            type === 'error' ? styles.errorShake : ''
                    }`}>
                        {defaultIcon}
                    </div>
                    <h3 className={styles.modalTitle}>{defaultTitle}</h3>
                    <p className={styles.modalMessage}>{defaultMessage}</p>
                </div>
                <div className={styles.modalButtons}>
                    <button className={styles.modalBtn} onClick={onClose}>
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;