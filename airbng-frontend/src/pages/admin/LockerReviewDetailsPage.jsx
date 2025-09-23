import React, { useState } from 'react';
import styles from '../../styles/admin/pages/LockerReviewDetails.module.css';
import lockeraddress from "../../assets/location.svg";
import lockerusername from "../../assets/lockeruser.svg";
import lockertel from "../../assets/call.svg";
import defaultImage from "../../assets/favicon.svg";
import { approveLockerReview, rejectLockerReview } from '../../api/admin/adminApi';
import { Modal, useModal } from '../../components/common/ModalUtil';

const StorageDetailModal = ({ storage, status, onApprove, onReject, onStatusChange, onClose, isOpen }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // useModal 훅을 컴포넌트 상단에서 호출
    const {
        modalState,
        hideModal,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    } = useModal();

    // 모달이 열려있지 않으면 렌더링하지 않음
    if (!isOpen || !storage) return null;

    const getImages = () => {
        if (storage?.result.images && storage.result.images.length > 0) {
            return storage.result.images;
        }
        return [defaultImage];
    };

    const images = getImages();
    const hasMultipleImages = images.length > 1;

    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        const numbers = phone.replace(/\D/g, '');
        if (numbers.length === 11) return `${numbers.slice(0,3)}-${numbers.slice(3,7)}-${numbers.slice(7,11)}`;
        if (numbers.length === 10) return `${numbers.slice(0,3)}-${numbers.slice(3,6)}-${numbers.slice(6,10)}`;
        return phone;
    };

    const nextImage = () => hasMultipleImages && setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    const prevImage = () => hasMultipleImages && setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
    const openImageModal = (index) => { setModalImageIndex(index); setIsImageModalOpen(true); };
    const closeImageModal = () => { setCurrentImageIndex(modalImageIndex); setIsImageModalOpen(false); };
    const nextModalImage = () => hasMultipleImages && setModalImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    const prevModalImage = () => hasMultipleImages && setModalImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);

    const getStatusBadgeClass = () => {
        switch (status) {
            case '대기중': case 'WAITING': return styles.statusPending;
            case '승인': case 'APPROVED': return styles.statusApproved;
            case '반려': case 'REJECTED': return styles.statusRejected;
            default: return styles.statusPending;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'WAITING': return '대기중';
            case 'APPROVED': return '승인';
            case 'REJECTED': return '반려';
            default: return status;
        }
    };

    const handleApprove = async () => {
        if (isLoading) return;
        try {
            setIsLoading(true);
            await approveLockerReview(storage.result.lockerId, storage.result.memberId);
            onApprove && onApprove(storage);
            onStatusChange && onStatusChange(storage.result.lockerId, 'APPROVED');

            // 올바른 파라미터 순서: title, message, callback
            showSuccess('승인 완료', '보관소가 승인되었습니다.', async () => {
                onClose && await onClose();
            });
        } catch (error) {
            console.error('보관소 승인 실패:', error);
            showError('오류', '보관소 승인에 실패했습니다.\n다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRejectClick = () => setShowRejectModal(true);

    const handleRejectConfirm = async () => {
        if (!rejectReason.trim() || isLoading) return;
        try {
            setIsLoading(true);
            await rejectLockerReview(storage.result.lockerId, storage.result.memberId, rejectReason);
            onReject && onReject(storage, rejectReason);
            onStatusChange && onStatusChange(storage.result.lockerId, 'REJECTED', rejectReason);
            setShowRejectModal(false);
            setRejectReason('');

            showSuccess('반려 완료', '보관소가 반려되었습니다.', async () => {
                onClose && await onClose();
            });
        } catch (error) {
            console.error('보관소 반려 실패:', error);
            showError('오류', '보관소 반려에 실패했습니다.\n다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRejectCancel = () => { setShowRejectModal(false); setRejectReason(''); };

    // 모달 외부 클릭 시 닫기
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose && onClose();
        }
    };

    const keeperName = storage.result.memberName;
    const keeperPhone = storage.result.memberPhone;
    const reviewComment = storage.result.reviewComment;
    const priceInfo = storage.result.jimTypeResults || storage.result.jimTypes;

    return (
        <>
            <div className={styles.storageModalOverlay} onClick={handleOverlayClick}>
                <div className={styles.storageModalContent} onClick={e => e.stopPropagation()}>
                    {/* 모달 닫기 버튼 */}
                    <button className={styles.storageModalCloseBtn} onClick={onClose}>
                        ×
                    </button>

                    <div className={`${styles.container} ${styles.modalInnerContainer}`}>
                        {/* 헤더 */}
                        <div className={`${styles.header} ${styles.modalHeader}`}>
                            <h2 className={styles.title}>
                                {storage.result.lockerName || 'Unknown Locker'}
                            </h2>
                            <span className={`${styles.statusBadge} ${getStatusBadgeClass()}`}>
                                {getStatusText()}
                            </span>
                        </div>

                        {/* 메인 콘텐츠 영역 - 3열 구조 */}
                        <div className={styles.mainContent}>
                            {/* 왼쪽 이미지 영역 */}
                            <div className={styles.imageSection}>
                                <div className={styles.imageContainer}>
                                    <div className={styles.imageTrack} style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
                                        {images.map((img, idx) => (
                                            <div key={idx} className={styles.imageSlide}>
                                                <img src={img} alt={`보관소 이미지 ${idx + 1}`} className={styles.sliderImage} onClick={() => openImageModal(idx)} />
                                            </div>
                                        ))}
                                    </div>
                                    {hasMultipleImages && (
                                        <>
                                            <button className={`${styles.sliderBtn} ${styles.prevBtn}`} onClick={prevImage}>&#8249;</button>
                                            <button className={`${styles.sliderBtn} ${styles.nextBtn}`} onClick={nextImage}>&#8250;</button>
                                        </>
                                    )}
                                    {hasMultipleImages && (
                                        <div className={styles.sliderIndicators}>
                                            {images.map((_, idx) => (
                                                <div key={idx} className={`${styles.indicator} ${idx === currentImageIndex ? styles.activeIndicator : ''}`} onClick={() => setCurrentImageIndex(idx)} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 가운데 정보 영역 */}
                            <div className={styles.infoSection}>
                                <div className={styles.infoRow}>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoIcon}><img src={lockeraddress} alt="주소" /></div>
                                        <div className={styles.infoContent}>
                                            <span className={styles.infoLabel}>주소</span>
                                            <span className={styles.infoValue}>{storage.result.address} {storage.result.addressDetail}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.infoRow}>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoIcon}><img src={lockerusername} alt="호스트" /></div>
                                        <div className={styles.infoContent}>
                                            <span className={styles.infoLabel}>호스트</span>
                                            <span className={styles.infoValue}>{keeperName || 'Unknown Host'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.infoRow}>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoIcon}><img src={lockertel} alt="전화번호" /></div>
                                        <div className={styles.infoContent}>
                                            <span className={styles.infoLabel}>전화번호</span>
                                            <span className={styles.infoValue}>{formatPhoneNumber(keeperPhone)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 오른쪽 가격 정보 영역 */}
                            {priceInfo && priceInfo.length > 0 && (
                                <div className={styles.priceSection}>
                                    <div className={styles.priceTitle}>가격</div>
                                    <div className={styles.priceItems}>
                                        {priceInfo.map((type, index) => (
                                            <div key={index} className={styles.priceItemRow}>
                                                <span className={styles.priceType}>{type.typeName}</span>
                                                <span className={styles.priceAmount}>{type.pricePerHour.toLocaleString()}원/시간당</span>
                                            </div>
                                        ))}
                                    </div>
                                    {(status === '대기' || status === 'WAITING') && (
                                        <div className={styles.actionButtonsSection}>
                                            <button className={styles.rejectButton} onClick={handleRejectClick} disabled={isLoading}>
                                                {isLoading ? '처리중...' : '반려'}
                                            </button>
                                            <button className={styles.approveButton} onClick={handleApprove} disabled={isLoading}>
                                                {isLoading ? '처리중...' : '승인'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 반려 사유 */}
                        {(status === '반려' || status === 'REJECTED') && reviewComment && (
                            <div className={styles.rejectReasonSection}>
                                <div className={styles.rejectReasonTitle}>반려 사유</div>
                                <div className={styles.rejectReasonContent}>{reviewComment}</div>
                            </div>
                        )}
                    </div>

                    {/* 반려 모달 */}
                    {showRejectModal && (
                        <div className={styles.rejectModalOverlay} onClick={handleRejectCancel}>
                            <div className={styles.rejectModalContent} onClick={e => e.stopPropagation()}>
                                <h3 className={styles.rejectModalTitle}>반려 사유</h3>
                                <textarea
                                    className={styles.rejectModalTextarea}
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    placeholder="반료 사유를 입력해주세요"
                                    rows={4}
                                    disabled={isLoading}
                                />
                                <div className={styles.rejectModalButtons}>
                                    <button className={styles.rejectModalCancelButton} onClick={handleRejectCancel} disabled={isLoading}>취소</button>
                                    <button className={styles.rejectModalConfirmButton} onClick={handleRejectConfirm} disabled={!rejectReason.trim() || isLoading}>
                                        {isLoading ? '처리중...' : '확인'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 이미지 모달 */}
                    {isImageModalOpen && (
                        <div className={styles.modalOverlay} onClick={closeImageModal}>
                            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                                <button className={styles.modalCloseBtn} onClick={closeImageModal}>✕</button>
                                <div className={styles.modalImageContainer}>
                                    <img src={images[modalImageIndex]} alt={`보관소 이미지 ${modalImageIndex + 1}`} className={styles.modalImage} />
                                    {hasMultipleImages && (
                                        <>
                                            <button className={`${styles.modalSliderBtn} ${styles.modalPrevBtn}`} onClick={prevModalImage}>&#8249;</button>
                                            <button className={`${styles.modalSliderBtn} ${styles.modalNextBtn}`} onClick={nextModalImage}>&#8250;</button>
                                        </>
                                    )}
                                </div>
                                {hasMultipleImages && (
                                    <div className={styles.modalIndicators}>
                                        {images.map((_, idx) => (
                                            <div key={idx} className={`${styles.modalIndicator} ${idx === modalImageIndex ? styles.modalActiveIndicator : ''}`} onClick={() => setModalImageIndex(idx)} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal 컴포넌트를 별도로 렌더링 */}
            <Modal
                show={modalState.show}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                showCancel={modalState.showCancel}
                onConfirm={modalState.onConfirm}
                onCancel={modalState.onCancel}
                onClose={hideModal}
            />
        </>
    );
};

export default StorageDetailModal;