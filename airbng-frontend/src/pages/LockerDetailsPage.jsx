// import React, { useState, useEffect } from 'react';
// import './LockerDetails.css';
//
// const LockerDetails = () => {
//     // URL에서 lockerId 추출
//     const urlParams = new URLSearchParams(window.location.search);
//     const lockerId = urlParams.get('lockerId');
//
//     const [lockerDetail, setLockerDetail] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//
//     // 로그인한 회원 ID (실제로는 AuthContext나 Redux에서 가져올 것)
//     const [memberId, setMemberId] = useState(null);
//
//     useEffect(() => {
//         // 세션이나 토큰에서 memberId 가져오기
//         const sessionMemberId = sessionStorage.getItem('memberId') ||
//             localStorage.getItem('memberId');
//         setMemberId(sessionMemberId);
//     }, []);
//
//     useEffect(() => {
//         if (!lockerId) {
//             setError('보관소 ID가 제공되지 않았습니다.');
//             setLoading(false);
//             return;
//         }
//
//         loadLockerDetails(lockerId);
//     }, [lockerId]);
//
//     const loadLockerDetails = async (lockerId) => {
//         try {
//             setLoading(true);
//             setError(null);
//
//             // API 서비스 사용
//             const data = await lockerService.getLockerById(lockerId);
//
//             if (data.code === 1000 && data.result) {
//                 setLockerDetail(data.result);
//
//                 // 세션 스토리지에 보관소 데이터 저장
//                 sessionStorage.setItem(`lockerData_${data.result.lockerId}`, JSON.stringify({
//                     lockerImage: data.result.images?.[0] || '',
//                     lockerName: data.result.lockerName,
//                     address: data.result.address,
//                     addressDetail: data.result.addressDetail
//                 }));
//
//                 console.log('보관소 데이터가 세션 스토리지에 저장되었습니다:',
//                     sessionStorage.getItem(`lockerData_${data.result.lockerId}`)
//                 );
//             } else {
//                 throw new Error(data.message || '보관소 정보를 불러오는데 실패했습니다.');
//             }
//         } catch (error) {
//             console.error('API 호출 에러:', error);
//             setError(handleApiError(error));
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const handleReserveClick = () => {
//         if (!lockerId || !memberId) {
//             if (window.confirm('로그인이 필요합니다. 로그인하러 이동하시겠습니까?')) {
//                 const currentUrl = `${window.location.pathname}${window.location.search}`;
//                 window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
//             }
//             return;
//         }
//
//         window.location.href = `/reservations/form?lockerId=${lockerId}`;
//     };
//
//     const formatPhoneNumber = (phone) => {
//         if (!phone) return '';
//
//         const numbers = phone.replace(/\D/g, '');
//
//         if (numbers.length === 11) {
//             return `${numbers.substring(0, 3)}-${numbers.substring(3, 7)}-${numbers.substring(7, 11)}`;
//         }
//
//         if (numbers.length === 10) {
//             return `${numbers.substring(0, 3)}-${numbers.substring(3, 6)}-${numbers.substring(6, 10)}`;
//         }
//
//         return phone;
//     };
//
//     const renderImageGallery = () => {
//         if (!lockerDetail?.images || lockerDetail.images.length === 0) {
//             return null;
//         }
//
//         const maxImages = Math.min(lockerDetail.images.length, 6);
//
//         return (
//             <div className="image-gallery">
//                 {lockerDetail.images.slice(0, maxImages).map((image, index) => (
//                     <img
//                         key={index}
//                         className="locker-image"
//                         src={image}
//                         alt={`보관소 이미지 ${index + 1}`}
//                         onError={(e) => { e.target.style.display = 'none'; }}
//                     />
//                 ))}
//             </div>
//         );
//     };
//
//     const renderPriceInfo = () => {
//         if (!lockerDetail?.jimTypeResults || lockerDetail.jimTypeResults.length === 0) {
//             return (
//                 <div className="price-info">
//                     <div className="price-title">가격 정보 없음</div>
//                     <div className="price-detail">• 가격 정보를 확인할 수 없습니다.</div>
//                 </div>
//             );
//         }
//
//         const typeNames = lockerDetail.jimTypeResults.map(type => type.typeName).join('/');
//
//         const priceDetails = lockerDetail.jimTypeResults.map(type =>
//             `• ${type.typeName}: 시간당 ${type.pricePerHour.toLocaleString()}원`
//         ).join('<br>');
//
//         return (
//             <div className="price-info">
//                 <div className="price-title">{typeNames}</div>
//                 <div
//                     className="price-detail"
//                     dangerouslySetInnerHTML={{
//                         __html: priceDetails + '<br>• 강남역 도보 3분'
//                     }}
//                 />
//             </div>
//         );
//     };
//
//     const renderLockerInfo = () => {
//         if (!lockerDetail) return null;
//
//         const fullAddress = `${lockerDetail.address} ${lockerDetail.addressDetail || ''}`.trim();
//
//         return (
//             <div className="info-section">
//                 <div className="info-item">
//                     <div className="info-label">주소</div>
//                     <div className="info-value">| {fullAddress}</div>
//                 </div>
//
//                 <div className="info-item">
//                     <div className="info-label">Address</div>
//                     <div className="info-value">| {lockerDetail.addressEnglish}</div>
//                 </div>
//
//                 <div className="info-item">
//                     <div className="info-label">맡아주는 사람</div>
//                     <div className="info-value">| {lockerDetail.keeperName}</div>
//                 </div>
//
//                 <div className="info-item">
//                     <div className="info-label">전화번호</div>
//                     <div className="info-value">| {formatPhoneNumber(lockerDetail.keeperPhone)}</div>
//                 </div>
//             </div>
//         );
//     };
//
//     // 로딩 상태
//     if (loading) {
//         return (
//             <div className="container">
//                 <Header />
//                 <div className="content">
//                     <div className="loading">보관소 정보를 불러오는 중...</div>
//                 </div>
//             </div>
//         );
//     }
//
//     // 에러 상태
//     if (error) {
//         return (
//             <div className="container">
//                 <Header />
//                 <div className="content">
//                     <div className="error">{error}</div>
//                 </div>
//             </div>
//         );
//     }
//
//     // 데이터가 없는 경우
//     if (!lockerDetail) {
//         return (
//             <div className="container">
//                 <Header />
//                 <div className="content">
//                     <div className="error">보관소 정보를 찾을 수 없습니다.</div>
//                 </div>
//             </div>
//         );
//     }
//
//     const isAvailable = lockerDetail.isAvailable !== 'NO';
//
//     return (
//         <div className="container">
//             <Header />
//
//             <div className="content">
//                 <div className="locker-title">{lockerDetail.lockerName}</div>
//
//                 {renderImageGallery()}
//
//                 {renderPriceInfo()}
//
//                 {renderLockerInfo()}
//             </div>
//
//             <div className="bottom-buttons">
//                 <button
//                     className={`reserve-btn ${!isAvailable ? 'disabled' : ''}`}
//                     onClick={handleReserveClick}
//                     disabled={!isAvailable}
//                 >
//                     {isAvailable ? '예약하러 가기' : '이용 불가'}
//                 </button>
//             </div>
//
//             <div className="spacer"></div>
//             <div className="spacer"></div>
//         </div>
//     );
// };
//
// // 헤더 컴포넌트 (별도 파일로 분리하는 것을 권장)
// const Header = () => {
//     return (
//         <header className="header">
//             <button
//                 className="back-button"
//                 onClick={() => window.history.back()}
//                 aria-label="뒤로가기"
//             >
//                 ←
//             </button>
//             <h1 className="header-title">보관소 상세</h1>
//         </header>
//     );
// };
//
// export default LockerDetails;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import { getLockerById  } from '../api/lockerApi'; // 경로 확인
import '../styles/pages/lockerDetails.css';

const LockerDetails = () => {

    const { lockerId } = useParams();
    const [lockerDetail, setLockerDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useAuth에서 로그인 회원 정보 가져오기
    const { user } = useAuth();
    const memberId = user?.id;

    useEffect(() => {
        if (!lockerId) {
            setError('보관소 ID가 제공되지 않았습니다.');
            setLoading(false);
            return;
        }

        loadLockerDetails(lockerId);
    }, [lockerId]);

    const loadLockerDetails = async (lockerId) => {
        try {
            setLoading(true);
            setError(null);

            // API 서비스 호출
            const data = await getLockerById(lockerId);

            if (data.code === 1000 && data.result) {
                setLockerDetail(data.result);

                // 세션 스토리지에 보관소 데이터 저장
                sessionStorage.setItem(
                    `lockerData_${data.result.lockerId}`,
                    JSON.stringify({
                        lockerImage: data.result.images?.[0] || '',
                        lockerName: data.result.lockerName,
                        address: data.result.address,
                        addressDetail: data.result.addressDetail,
                    })
                );
            } else {
                throw new Error(data.message || '보관소 정보를 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('API 호출 에러:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReserveClick = () => {
        if (!lockerId || !memberId) {
            if (window.confirm('로그인이 필요합니다. 로그인하러 이동하시겠습니까?')) {
                const currentUrl = `${window.location.pathname}${window.location.search}`;
                window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
            }
            return;
        }

        window.location.href = `/reservations/form?lockerId=${lockerId}`;
    };

    const formatPhoneNumber = (phone) => {
        if (!phone) return '';

        const numbers = phone.replace(/\D/g, '');

        if (numbers.length === 11) {
            return `${numbers.substring(0, 3)}-${numbers.substring(3, 7)}-${numbers.substring(7, 11)}`;
        }

        if (numbers.length === 10) {
            return `${numbers.substring(0, 3)}-${numbers.substring(3, 6)}-${numbers.substring(6, 10)}`;
        }

        return phone;
    };

    const renderImageGallery = () => {
        if (!lockerDetail?.images || lockerDetail.images.length === 0) return null;

        const maxImages = Math.min(lockerDetail.images.length, 6);

        return (
            <div className="image-gallery">
                {lockerDetail.images.slice(0, maxImages).map((image, index) => (
                    <img
                        key={index}
                        className="locker-image"
                        src={image}
                        alt={`보관소 이미지 ${index + 1}`}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ))}
            </div>
        );
    };

    const renderPriceInfo = () => {
        if (!lockerDetail?.jimTypeResults || lockerDetail.jimTypeResults.length === 0) {
            return (
                <div className="price-info">
                    <div className="price-title">가격 정보 없음</div>
                    <div className="price-detail">• 가격 정보를 확인할 수 없습니다.</div>
                </div>
            );
        }

        const typeNames = lockerDetail.jimTypeResults.map(type => type.typeName).join('/');
        const priceDetails = lockerDetail.jimTypeResults
            .map(type => `• ${type.typeName}: 시간당 ${type.pricePerHour.toLocaleString()}원`)
            .join('<br>');

        return (
            <div className="price-info">
                <div className="price-title">{typeNames}</div>
                <div
                    className="price-detail"
                    dangerouslySetInnerHTML={{ __html: priceDetails + '<br>• 강남역 도보 3분' }}
                />
            </div>
        );
    };

    const renderLockerInfo = () => {
        if (!lockerDetail) return null;

        const fullAddress = `${lockerDetail.address} ${lockerDetail.addressDetail || ''}`.trim();

        return (
            <div className="info-section">
                <div className="info-item">
                    <div className="info-label">주소</div>
                    <div className="info-value">| {fullAddress}</div>
                </div>

                <div className="info-item">
                    <div className="info-label">Address</div>
                    <div className="info-value">| {lockerDetail.addressEnglish}</div>
                </div>

                <div className="info-item">
                    <div className="info-label">맡아주는 사람</div>
                    <div className="info-value">| {lockerDetail.keeperName}</div>
                </div>

                <div className="info-item">
                    <div className="info-label">전화번호</div>
                    <div className="info-value">| {formatPhoneNumber(lockerDetail.keeperPhone)}</div>
                </div>
            </div>
        );
    };

    if (loading) return <Loader message="보관소 정보를 불러오는 중..." />;
    if (error) return <Loader message={error} isError />;
    if (!lockerDetail) return <Loader message="보관소 정보를 찾을 수 없습니다." isError />;

    const isAvailable = lockerDetail.isAvailable !== 'NO';

    return (
        <div className="container">
            <Header />

            <div className="content">
                <div className="locker-title">{lockerDetail.lockerName}</div>

                {renderImageGallery()}
                {renderPriceInfo()}
                {renderLockerInfo()}
            </div>

            <div className="bottom-buttons">
                <button
                    className={`reserve-btn ${!isAvailable ? 'disabled' : ''}`}
                    onClick={handleReserveClick}
                    disabled={!isAvailable}
                >
                    {isAvailable ? '예약하러 가기' : '이용 불가'}
                </button>
            </div>

            <div className="spacer" />
            <div className="spacer" />
        </div>
    );
};

const Header = () => (
    <header className="header">
        <button className="back-button" onClick={() => window.history.back()} aria-label="뒤로가기">
            ←
        </button>
        <h1 className="header-title">보관소 상세</h1>
    </header>
);

// 로딩/에러 공용 컴포넌트
const Loader = ({ message, isError }) => (
    <div className="container">
        <Header />
        <div className="content">
            <div className={isError ? 'error' : 'loading'}>{message}</div>
        </div>
    </div>
);

export default LockerDetails;
