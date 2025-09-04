import { useState } from 'react';

const useModal = () => {
    // 모달 상태
    const [confirmModal, setConfirmModal] = useState({ show: false, reservationId: null });
    const [successModal, setSuccessModal] = useState({ show: false, refundAmount: 0 });
    const [errorModal, setErrorModal] = useState({ show: false });

    // 모달 제어 함수들
    const showConfirmModal = (reservationId) => {
        setConfirmModal({ show: true, reservationId });
    };

    const hideConfirmModal = () => {
        setConfirmModal({ show: false, reservationId: null });
    };

    const showSuccessModal = (refundAmount = 0) => {
        setSuccessModal({ show: true, refundAmount });
    };

    const hideSuccessModal = () => {
        setSuccessModal({ show: false, refundAmount: 0 });
    };

    const showErrorModal = () => {
        setErrorModal({ show: true });
    };

    const hideErrorModal = () => {
        setErrorModal({ show: false });
    };

    return {
        // Modal States
        confirmModal,
        successModal,
        errorModal,
        // Modal Actions
        showConfirmModal,
        hideConfirmModal,
        showSuccessModal,
        hideSuccessModal,
        showErrorModal,
        hideErrorModal
    };
};

export default useModal;