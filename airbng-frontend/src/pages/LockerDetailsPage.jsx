// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useLocation } from 'react-router-dom';
// import { getLockerById } from '../api/lockerApi'; // 경로 확인
// import '../styles/pages/lockerDetails.css';
//
// // URL 쿼리 파라미터 훅
// function useQuery() {
//     return new URLSearchParams(useLocation().search);
// }
//
// const LockerDetails = () => {
//     const query = useQuery();
//     // const lockerId = query.get('lockerId'); // ?lockerId=숫자
//     const lockerId = 1;
//     console.log('lockerId:', lockerId);
//
//     const [lockerDetail, setLockerDetail] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//
//     const { user } = useAuth();
//     const memberId = user?.id;
//
//     // API 호출
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
//             const data = await getLockerById(lockerId);
//
//             if (data.code === 1000 && data.result) {
//                 setLockerDetail(data.result);
//
//                 // 세션 스토리지 저장
//                 sessionStorage.setItem(
//                     `lockerData_${data.result.lockerId}`,
//                     JSON.stringify({
//                         lockerImage: data.result.images?.[0] || '',
//                         lockerName: data.result.lockerName,
//                         address: data.result.address,
//                         addressDetail: data.result.addressDetail,
//                     })
//                 );
//             } else {
//                 throw new Error(data.message || '보관소 정보를 불러오는데 실패했습니다.');
//             }
//         } catch (err) {
//             console.error('API 호출 에러:', err);
//             setError(err.message);
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
//         window.location.href = `/reservations/form?lockerId=${lockerId}`;
//     };
//
//     const formatPhoneNumber = (phone) => {
//         if (!phone) return '';
//         const numbers = phone.replace(/\D/g, '');
//         if (numbers.length === 11) return `${numbers.slice(0,3)}-${numbers.slice(3,7)}-${numbers.slice(7,11)}`;
//         if (numbers.length === 10) return `${numbers.slice(0,3)}-${numbers.slice(3,6)}-${numbers.slice(6,10)}`;
//         return phone;
//     };
//
//     // 렌더 함수
//     const renderImageGallery = () => {
//         if (!lockerDetail?.images || lockerDetail.images.length === 0) return null;
//         return (
//             <div className="image-gallery">
//                 {lockerDetail.images.slice(0, 6).map((img, idx) => (
//                     <img
//                         key={idx}
//                         src={img}
//                         alt={`보관소 이미지 ${idx + 1}`}
//                         className="locker-image"
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
//         const priceDetails = lockerDetail.jimTypeResults
//             .map(type => `• ${type.typeName}: 시간당 ${type.pricePerHour.toLocaleString()}원`)
//             .join('<br>');
//
//         return (
//             <div className="price-info">
//                 <div className="price-title">{typeNames}</div>
//                 <div className="price-detail" dangerouslySetInnerHTML={{ __html: priceDetails + '<br>• 강남역 도보 3분' }} />
//             </div>
//         );
//     };
//
//     const renderLockerInfo = () => {
//         if (!lockerDetail) return null;
//         const fullAddress = `${lockerDetail.address} ${lockerDetail.addressDetail || ''}`.trim();
//
//         return (
//             <div className="info-section">
//                 <div className="info-item">
//                     <div className="info-label">주소</div>
//                     <div className="info-value">| {fullAddress}</div>
//                 </div>
//                 <div className="info-item">
//                     <div className="info-label">Address</div>
//                     <div className="info-value">| {lockerDetail.addressEnglish}</div>
//                 </div>
//                 <div className="info-item">
//                     <div className="info-label">맡아주는 사람</div>
//                     <div className="info-value">| {lockerDetail.keeperName}</div>
//                 </div>
//                 <div className="info-item">
//                     <div className="info-label">전화번호</div>
//                     <div className="info-value">| {formatPhoneNumber(lockerDetail.keeperPhone)}</div>
//                 </div>
//             </div>
//         );
//     };
//
//     // Header 컴포넌트
//     const Header = () => (
//         <header className="header">
//             <button className="back-button" onClick={() => window.history.back()} aria-label="뒤로가기">←</button>
//             <h1 className="header-title">보관소 상세</h1>
//         </header>
//     );
//
//     // Loader 컴포넌트
//     const Loader = ({ message, isError }) => (
//         <div className="container">
//             <Header />
//             <div className="content">
//                 <div className={isError ? 'error' : 'loading'}>{message}</div>
//             </div>
//         </div>
//     );
//
//     // 로딩/에러 처리
//     if (loading) return <Loader message="보관소 정보를 불러오는 중..." />;
//     if (error) return <Loader message={error} isError />;
//     if (!lockerDetail) return <Loader message="보관소 정보를 찾을 수 없습니다." isError />;
//
//     const isAvailable = lockerDetail.isAvailable !== 'NO';
//
//     return (
//         <div className="container">
//             <Header />
//             <div className="content">
//                 <div className="locker-title">{lockerDetail.lockerName}</div>
//                 {renderImageGallery()}
//                 {renderPriceInfo()}
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
//             <div className="spacer" />
//             <div className="spacer" />
//         </div>
//     );
// };
//
// export default LockerDetails;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useLocation } from 'react-router-dom';
import { getLockerById } from '../api/lockerApi';
import '../styles/pages/lockerDetails.css';

// URL 쿼리 파라미터 훅
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const LockerDetails = () => {
    const { lockerId: paramId } = useParams(); // URL 파라미터
    const query = useQuery(); // 쿼리 파라미터
    const queryId = query.get('lockerId'); // ?lockerId=숫자

    // URL 파라미터 우선, 없으면 쿼리 파라미터 사용
    const lockerId = paramId || queryId;
    console.log('lockerId:', lockerId);

    const [lockerDetail, setLockerDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

                const { data } = await getLockerById(id);

                if (data.code === 1000 && data.result) {
                    setLockerDetail(data.result);

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
            } catch (err) {
                console.error('API 호출 에러:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadLockerDetails(lockerId);
    }, [lockerId]);

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
        if (numbers.length === 11) return `${numbers.slice(0,3)}-${numbers.slice(3,7)}-${numbers.slice(7,11)}`;
        if (numbers.length === 10) return `${numbers.slice(0,3)}-${numbers.slice(3,6)}-${numbers.slice(6,10)}`;
        return phone;
    };

    // 렌더 함수
    const renderImageGallery = () => {
        if (!lockerDetail?.images || lockerDetail.images.length === 0) return null;
        return (
            <div className="image-gallery">
                {lockerDetail.images.slice(0, 6).map((img, idx) => (
                    <img
                        key={idx}
                        src={img}
                        alt={`보관소 이미지 ${idx + 1}`}
                        className="locker-image"
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
                <div className="price-detail" dangerouslySetInnerHTML={{ __html: priceDetails + '<br>• 강남역 도보 3분' }} />
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

    const Header = () => (
        <header className="header">
            <button className="back-button" onClick={() => window.history.back()} aria-label="뒤로가기">←</button>
            <h1 className="header-title">보관소 상세</h1>
        </header>
    );

    const Loader = ({ message, isError }) => (
        <div className="container">
            <Header />
            <div className="content">
                <div className={isError ? 'error' : 'loading'}>{message}</div>
            </div>
        </div>
    );

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

export default LockerDetails;
