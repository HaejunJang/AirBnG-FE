import React from 'react';
import "../../styles/common/modal.css"

const Modals = ({
                    confirmModal,
                    successModal,
                    errorModal,
                    hideConfirmModal,
                    hideSuccessModal,
                    hideErrorModal,
                    onDeleteConfirm
                }) => {
    return (
        <>
            {/* 삭제 확인 모달 */}
            {confirmModal.show && (
                <div className="modal-overlay" onClick={hideConfirmModal}>
                        <div className="modal-contents" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-icon confirm-bounce">?</div>
                            <div className="modal-title">예약을 삭제하시겠어요?</div>
                            <div className="modal-message">
                                삭제하면 되돌릴 수 없어요.<br/>
                                정말 삭제하시겠어요?
                            </div>
                        {/*</div>*/}
                        <div className="modal-buttons two-buttons">
                            <button
                                className="modal-btn cancel"
                                onClick={hideConfirmModal}
                            >
                                취소
                            </button>
                            <button
                                className="modal-btn confirm"
                                onClick={() => {
                                    onDeleteConfirm(confirmModal.reservationId);
                                    hideConfirmModal();
                                }}
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 삭제 성공 모달 */}
            {successModal.show && (
                <div className="modal-overlay">
                        <div className="modal-contents">
                            <div className="modal-icon success-rotate">✓</div>
                            <div className="modal-title">예약 내역을 삭제했어요!</div>
                            <div className="modal-message">
                                <span>{successModal.refundAmount}원</span>의 수수료가 발생했어요!
                            </div>
                            <div className="modal-buttons">
                                <button
                                    className="modal-btn"
                                    onClick={hideSuccessModal}
                                    style={{width: '100%', borderRight: 'none'}}
                                >
                                    확인
                                </button>
                            </div>
                        </div>

                </div>
            )}

            {/* 삭제 실패 모달 */}
            {errorModal.show && (
                <div className="modal-overlay" onClick={hideErrorModal}>
                        <div className="modal-contents" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-icon error-shake">✗</div>
                            <div className="modal-title">예약 삭제 실패</div>
                            <div className="modal-message">
                                삭제 중 오류가 발생했습니다.<br/>
                                잠시 후 다시 시도해주세요.
                            </div>
                            <div className="modal-buttons">
                                <button
                                    className="modal-btn"
                                    onClick={hideErrorModal}
                                    style={{width: '100%', borderRight: 'none'}}
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                </div>
            )}
        </>
    );
};

export default Modals;