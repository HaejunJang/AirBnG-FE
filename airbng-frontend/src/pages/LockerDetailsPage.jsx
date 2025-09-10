import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useLocation } from 'react-router-dom';
import { getLockerById } from '../api/lockerApi';
import { getReservationForm } from '../api/reservationApi'; // 새로 추가된 import
import styles from '../styles/pages/lockerDetails.module.css';
import lockeraddress from "../assets/location.svg"
import lockerusername from "../assets/lockeruser.svg"
import lockertel from "../assets/call.svg"

// URL 쿼리 파라미터 훅
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const LockerDetails = () => {
    const { lockerId: paramId } = useParams();
    const query = useQuery();
    const queryId = query.get('lockerId');

    const lockerId = paramId || queryId;
    console.log('lockerId:', lockerId);

    const [lockerDetail, setLockerDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);

    const { user } = useAuth();
    const memberId = user?.id;

    useEffect(() => {
        if (!lockerId) {
            setError('보관소 ID가 제공되지 않았습니다.');
            setLoading(false);
            return;
        }

        const loadLockerDetails = async (id) => {
            try {
                setLoading(true);
                setError(null);

                console.log('API 호출 시작 - lockerId:', id);
                const response = await getLockerById(id);
                console.log('API 응답 전체:', response);

                let apiData;
                if (response.data) {
                    apiData = response.data;
                    console.log('axios 응답 데이터:', apiData);
                } else if (response.code) {
                    apiData = response;
                    console.log('직접 응답 데이터:', apiData);
                } else {
                    throw new Error('예상하지 못한 응답 형식입니다.');
                }

                if (apiData.code === 1000 && apiData.result) {
                    console.log('보관소 상세 데이터:', apiData.result);
                    console.log('짐 타입 데이터:', apiData.result.jimTypeResults);

                    setLockerDetail(apiData.result);

                    sessionStorage.setItem(
                        `lockerData_${apiData.result.lockerId}`,
                        JSON.stringify({
                            lockerImage: apiData.result.images?.[0] || '',
                            lockerName: apiData.result.lockerName,
                            address: apiData.result.address,
                            addressDetail: apiData.result.addressDetail,
                        })
                    );
                } else {
                    console.error('API 응답 오류:', apiData);
                    throw new Error(apiData.message || '보관소 정보를 불러오는데 실패했습니다.');
                }
            } catch (err) {
                console.error('API 호출 에러:', err);
                setError(err.message || '보관소 정보를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadLockerDetails(lockerId);
    }, [lockerId]);

    const handleReserveClick = async () => {
        if (!lockerId || !memberId) {
            if (window.confirm('로그인이 필요합니다. 로그인하러 이동하시겠습니까?')) {
                const currentUrl = `${window.location.pathname}${window.location.search}`;
                window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
            }
            return;
        }

        try {
            // getReservationForm API 호출
            await getReservationForm(lockerId);
            // API 호출이 성공하면 예약 폼 페이지로 이동
            window.location.href = `/page/reservations/form?lockerId=${lockerId}`;
        } catch (error) {
            console.error('예약 폼 API 호출 에러:', error);
            // 에러가 발생해도 페이지는 이동 (API가 단순 확인용일 수도 있음)
            window.location.href = `/page/reservations/form?lockerId=${lockerId}`;
        }
    };

    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        const numbers = phone.replace(/\D/g, '');
        if (numbers.length === 11) return `${numbers.slice(0,3)}-${numbers.slice(3,7)}-${numbers.slice(7,11)}`;
        if (numbers.length === 10) return `${numbers.slice(0,3)}-${numbers.slice(3,6)}-${numbers.slice(6,10)}`;
        return phone;
    };

    // 이미지 슬라이더 관련 함수들
    const nextImage = () => {
        if (lockerDetail?.images && lockerDetail.images.length > 0) {
            setCurrentImageIndex((prev) =>
                prev === lockerDetail.images.length - 1 ? 0 : prev + 1
            );
        }
    };

    const prevImage = () => {
        if (lockerDetail?.images && lockerDetail.images.length > 0) {
            setCurrentImageIndex((prev) =>
                prev === 0 ? lockerDetail.images.length - 1 : prev - 1
            );
        }
    };

    const openModal = (index) => {
        setModalImageIndex(index);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setCurrentImageIndex(modalImageIndex); // 모달에서 본 이미지로 메인 슬라이더 업데이트
        setIsModalOpen(false);
    };

    const nextModalImage = () => {
        if (lockerDetail?.images && lockerDetail.images.length > 0) {
            setModalImageIndex((prev) =>
                prev === lockerDetail.images.length - 1 ? 0 : prev + 1
            );
        }
    };

    const prevModalImage = () => {
        if (lockerDetail?.images && lockerDetail.images.length > 0) {
            setModalImageIndex((prev) =>
                prev === 0 ? lockerDetail.images.length - 1 : prev - 1
            );
        }
    };

    // 이미지 갤러리 렌더링
    const renderImageGallery = () => {
        if (!lockerDetail?.images || lockerDetail.images.length === 0) return null;

        const images = lockerDetail.images.slice(0, 5); // 최대 5장만

        return (
            <div className={styles.imageSliderContainer}>
                <div className={styles.imageSlider}>
                    <div
                        className={styles.imageTrack}
                        style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                    >
                        {images.map((img, idx) => (
                            <div key={idx} className={styles.imageSlide}>
                                <img
                                    src={img}
                                    alt={`보관소 이미지 ${idx + 1}`}
                                    className={styles.sliderImage}
                                    onClick={() => openModal(idx)}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        ))}
                    </div>

                    {images.length > 1 && (
                        <>
                            <button className={`${styles.sliderBtn} ${styles.prev}`} onClick={prevImage}>
                                &#8249;
                            </button>
                            <button className={`${styles.sliderBtn} ${styles.next}`} onClick={nextImage}>
                                &#8250;
                            </button>
                        </>
                    )}

                    {/* 인디케이터 - 이미지 하단 중앙에 위치 */}
                    {images.length > 1 && (
                        <div className={styles.sliderIndicators}>
                            {images.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`${styles.indicator} ${idx === currentImageIndex ? styles.active : ''}`}
                                    onClick={() => setCurrentImageIndex(idx)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // 이미지 모달 렌더링
    const renderImageModal = () => {
        if (!isModalOpen || !lockerDetail?.images) return null;

        const images = lockerDetail.images.slice(0, 5);

        return (
            <div className={styles.imageModalOverlay} onClick={closeModal}>
                <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.modalCloseBtn} onClick={closeModal}>
                        ✕
                    </button>

                    <div className={styles.modalImageContainer}>
                        <img
                            src={images[modalImageIndex]}
                            alt={`보관소 이미지 ${modalImageIndex + 1}`}
                            className={styles.modalImage}
                        />

                        {images.length > 1 && (
                            <>
                                <button className={`${styles.modalSliderBtn} ${styles.prev}`} onClick={prevModalImage}>
                                    &#8249;
                                </button>
                                <button className={`${styles.modalSliderBtn} ${styles.next}`} onClick={nextModalImage}>
                                    &#8250;
                                </button>
                            </>
                        )}
                    </div>

                    {/* 모달 인디케이터 */}
                    {images.length > 1 && (
                        <div className={styles.modalIndicators}>
                            {images.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`${styles.modalIndicator} ${idx === modalImageIndex ? styles.active : ''}`}
                                    onClick={() => setModalImageIndex(idx)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderPriceInfo = () => {
        console.log('renderPriceInfo 호출 - jimTypeResults:', lockerDetail?.jimTypeResults);

        if (!lockerDetail?.jimTypeResults || !Array.isArray(lockerDetail.jimTypeResults) || lockerDetail.jimTypeResults.length === 0) {
            console.log('짐 타입 데이터가 없습니다:', lockerDetail?.jimTypeResults);
            return (
                <div className={styles.priceSection}>
                    <div className={styles.priceTitle}>가격</div>
                    <div className={styles.priceItems}>
                        <div className={styles.priceItemRow}>
                            <span className={styles.priceType}>정보 없음</span>
                            <span className={styles.priceAmount}>가격 정보를 확인할 수 없습니다</span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.priceSection}>
                <div className={styles.priceTitle}>가격</div>
                <div className={styles.priceItems}>
                    {lockerDetail.jimTypeResults
                        .filter(type => type && type.typeName && type.pricePerHour)
                        .map((type, index) => (
                            <div key={index} className={styles.priceItemRow}>
                                <span className={styles.priceType}>{type.typeName}</span>
                                <span className={styles.priceAmount}>{type.pricePerHour.toLocaleString()}원/시간당</span>
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    };

    const renderLockerInfo = () => {
        if (!lockerDetail) return null;
        const fullAddress = `${lockerDetail.address} ${lockerDetail.addressDetail || ''}`.trim();

        return (
            <div className={styles.infoSection}>
                <div className={styles.infoRow}>
                    <div className={styles.infoItem}>
                        <div className={styles.infoIcon}> <img src={lockeraddress} alt="주소" />
                        </div>
                        <div className={styles.infoContent}>
                            <span className={styles.infoLabel}>주소</span>
                            <span className={styles.infoValue}>{fullAddress}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.infoRow}>
                    <div className={styles.infoItem}>
                        <div className={styles.infoIcon}><img src={lockerusername} alt="호스트" /></div>
                        <div className={styles.infoContent}>
                            <span className={styles.infoLabel}>호스트</span>
                            <span className={styles.infoValue}>{lockerDetail.keeperName}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.infoRow}>
                    <div className={styles.infoItem}>
                        <div className={styles.infoIcon}><img src={lockertel} alt="전화번호" /></div>
                        <div className={styles.infoContent}>
                            <span className={styles.infoLabel}>전화번호</span>
                            <span className={styles.infoValue}>{formatPhoneNumber(lockerDetail.keeperPhone)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const Header = () => (
        <header className={styles.header}>
            <button className={styles.backButton} onClick={() => window.history.back()} aria-label="뒤로가기">←</button>
            <h1 className={styles.headerTitle}>보관소 상세</h1>
        </header>
    );

    const Loader = ({ message, isError }) => (
        <div className={styles.container}>
            <Header />
            <div className={styles.content}>
                <div className={isError ? styles.error : styles.loading}>{message}</div>
            </div>
        </div>
    );

    if (loading) return <Loader message="보관소 정보를 불러오는 중..." />;
    if (error) return <Loader message={error} isError />;
    if (!lockerDetail) return <Loader message="보관소 정보를 찾을 수 없습니다." isError />;

    const isAvailable = lockerDetail.isAvailable !== 'NO';

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.content}>
                {renderImageGallery()}
                <div className={styles.lockerTitle}>{lockerDetail.lockerName}</div>
                {renderLockerInfo()}
                {renderPriceInfo()}
            </div>

            <div className={styles.bottomSection}>
                <div className={styles.bottomButtons}>
                    <button
                        className={`${styles.reserveBtn} ${!isAvailable ? styles.disabled : ''}`}
                        onClick={handleReserveClick}
                        disabled={!isAvailable}
                    >
                        {isAvailable ? '보관소 선택' : '이용 불가'}
                    </button>
                </div>
            </div>

            {renderImageModal()}
        </div>
    );
};

export default LockerDetails;