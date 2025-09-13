import React, { useState } from 'react';
import styles from '../../styles/admin/pages/LockerReviewDetails.module.css';

const StorageDetailModal = ({ storage, status, onApprove, onReject }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        const numbers = phone.replace(/\D/g, '');
        if (numbers.length === 11) return `${numbers.slice(0,3)}-${numbers.slice(3,7)}-${numbers.slice(7,11)}`;
        if (numbers.length === 10) return `${numbers.slice(0,3)}-${numbers.slice(3,6)}-${numbers.slice(6,10)}`;
        return phone;
    };

    const nextImage = () => {
        if (storage?.images && storage.images.length > 1) {
            setCurrentImageIndex((prev) =>
                prev === storage.images.length - 1 ? 0 : prev + 1
            );
        }
    };

    const prevImage = () => {
        if (storage?.images && storage.images.length > 1) {
            setCurrentImageIndex((prev) =>
                prev === 0 ? storage.images.length - 1 : prev - 1
            );
        }
    };

    const openModal = (index) => {
        setModalImageIndex(index);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setCurrentImageIndex(modalImageIndex);
        setIsModalOpen(false);
    };

    const nextModalImage = () => {
        if (storage?.images && storage.images.length > 1) {
            setModalImageIndex((prev) =>
                prev === storage.images.length - 1 ? 0 : prev + 1
            );
        }
    };

    const prevModalImage = () => {
        if (storage?.images && storage.images.length > 1) {
            setModalImageIndex((prev) =>
                prev === 0 ? storage.images.length - 1 : prev - 1
            );
        }
    };

    const getStatusBadgeClass = () => {
        switch (status) {
            case '대기중':
                return styles.statusPending;
            case '승인됨':
                return styles.statusApproved;
            case '반려됨':
                return styles.statusRejected;
            default:
                return styles.statusPending;
        }
    };

    const handleApprove = () => {
        if (onApprove) {
            onApprove(storage);
        }
    };

    const handleRejectClick = () => {
        setShowRejectModal(true);
    };

    const handleRejectConfirm = () => {
        if (rejectReason.trim() && onReject) {
            onReject(storage, rejectReason);
            setShowRejectModal(false);
            setRejectReason('');
        }
    };

    const handleRejectCancel = () => {
        setShowRejectModal(false);
        setRejectReason('');
    };

    if (!storage) return null;

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>
                <h2 className={styles.title}>{storage.lockerName}</h2>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass()}`}>
                    {status}
                </span>
            </div>

            {/* 이미지 슬라이더 */}
            {storage.images && storage.images.length > 0 && (
                <div className={styles.imageSliderContainer}>
                    <div className={styles.imageSlider}>
                        <div
                            className={styles.imageTrack}
                            style={{
                                transform: `translateX(-${currentImageIndex * 100}%)`
                            }}
                        >
                            {storage.images.map((img, idx) => (
                                <div key={idx} className={styles.imageSlide}>
                                    <img
                                        src={img}
                                        alt={`보관소 이미지 ${idx + 1}`}
                                        className={styles.sliderImage}
                                        onClick={() => openModal(idx)}
                                    />
                                </div>
                            ))}
                        </div>

                        {storage.images.length > 1 && (
                            <>
                                <button
                                    className={`${styles.sliderBtn} ${styles.prevBtn}`}
                                    onClick={prevImage}
                                >
                                    &#8249;
                                </button>
                                <button
                                    className={`${styles.sliderBtn} ${styles.nextBtn}`}
                                    onClick={nextImage}
                                >
                                    &#8250;
                                </button>
                            </>
                        )}

                        {storage.images.length > 1 && (
                            <div className={styles.sliderIndicators}>
                                {storage.images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`${styles.indicator} ${
                                            idx === currentImageIndex ? styles.activeIndicator : ''
                                        }`}
                                        onClick={() => setCurrentImageIndex(idx)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 보관소 정보 */}
            <div className={styles.infoSection}>
                <div className={styles.infoRow}>
                    <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>📍</div>
                        <div className={styles.infoContent}>
                            <span className={styles.infoLabel}>주소</span>
                            <span className={styles.infoValue}>
                                {storage.address} {storage.addressDetail}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.infoRow}>
                    <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>👤</div>
                        <div className={styles.infoContent}>
                            <span className={styles.infoLabel}>호스트</span>
                            <span className={styles.infoValue}>{storage.keeperName}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.infoRow}>
                    <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>📞</div>
                        <div className={styles.infoContent}>
                            <span className={styles.infoLabel}>전화번호</span>
                            <span className={styles.infoValue}>
                                {formatPhoneNumber(storage.keeperPhone)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 가격 정보 */}
            {storage.jimTypeResults && storage.jimTypeResults.length > 0 && (
                <div className={styles.priceSection}>
                    <div className={styles.priceTitle}>가격</div>
                    <div className={styles.priceItems}>
                        {storage.jimTypeResults.map((type, index) => (
                            <div key={index} className={styles.priceItemRow}>
                                <span className={styles.priceType}>{type.typeName}</span>
                                <span className={styles.priceAmount}>
                                    {type.pricePerHour.toLocaleString()}원/시간당
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 반려 사유 (반려된 보관소의 경우) */}
            {status === '반려됨' && storage.rejectReason && (
                <div className={styles.rejectReasonSection}>
                    <div className={styles.rejectReasonTitle}>반려 사유</div>
                    <div className={styles.rejectReasonContent}>
                        {storage.rejectReason}
                    </div>
                </div>
            )}

            {/* 승인/반려 버튼 (대기중인 보관소의 경우) */}
            {status === '대기중' && (
                <div className={styles.actionButtonsSection}>
                    <button
                        className={styles.approveButton}
                        onClick={handleApprove}
                    >
                        승인
                    </button>
                    <button
                        className={styles.rejectButton}
                        onClick={handleRejectClick}
                    >
                        반려
                    </button>
                </div>
            )}

            {/* 반려 사유 입력 모달 */}
            {showRejectModal && (
                <div className={styles.rejectModalOverlay} onClick={handleRejectCancel}>
                    <div className={styles.rejectModalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.rejectModalTitle}>반려 사유</h3>
                        <textarea
                            className={styles.rejectModalTextarea}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="반려 사유를 입력해주세요"
                            rows={4}
                        />
                        <div className={styles.rejectModalButtons}>
                            <button
                                className={styles.rejectModalCancelButton}
                                onClick={handleRejectCancel}
                            >
                                취소
                            </button>
                            <button
                                className={styles.rejectModalConfirmButton}
                                onClick={handleRejectConfirm}
                                disabled={!rejectReason.trim()}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 이미지 모달 */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalCloseBtn} onClick={closeModal}>
                            ✕
                        </button>

                        <div className={styles.modalImageContainer}>
                            <img
                                src={storage.images[modalImageIndex]}
                                alt={`보관소 이미지 ${modalImageIndex + 1}`}
                                className={styles.modalImage}
                            />

                            {storage.images.length > 1 && (
                                <>
                                    <button
                                        className={`${styles.modalSliderBtn} ${styles.modalPrevBtn}`}
                                        onClick={prevModalImage}
                                    >
                                        &#8249;
                                    </button>
                                    <button
                                        className={`${styles.modalSliderBtn} ${styles.modalNextBtn}`}
                                        onClick={nextModalImage}
                                    >
                                        &#8250;
                                    </button>
                                </>
                            )}
                        </div>

                        {storage.images.length > 1 && (
                            <div className={styles.modalIndicators}>
                                {storage.images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`${styles.modalIndicator} ${
                                            idx === modalImageIndex ? styles.modalActiveIndicator : ''
                                        }`}
                                        onClick={() => setModalImageIndex(idx)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorageDetailModal;