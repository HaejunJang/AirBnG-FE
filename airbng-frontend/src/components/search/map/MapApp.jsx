// // import React, { useState, useEffect } from 'react';
// // import MapContainer from './MapContainer';
// // import BottomSheet from './BottomSheet';
// // import SearchControls from './SearchControls';
// // import { useLockers } from '../../../hooks/useLockers';
// // import {searchLockers} from "../../../api/lockerApi";
// // import {useLocation} from "react-router-dom";
// //
// // const MapApp = () => {
// //     const location = useLocation();
// //     const urlParams = new URLSearchParams(location.search);
// //     const initialAddress = urlParams.get("address") || "";
// //     const initialReservationDate = urlParams.get("reservationDate") || new Date().toISOString().split("T")[0];
// //     const initialJimTypeId = urlParams.get("jimTypeId") || "0";
// //
// //     const [address, setAddress] = useState(initialAddress);
// //     const [reservationDate, setReservationDate] = useState(initialReservationDate);
// //     const [jimTypeId, setJimTypeId] = useState(initialJimTypeId);
// //     const [lockerName, setLockerName] = useState(urlParams.get("lockerName") || "");
// //     const [selectedLockerId, setSelectedLockerId] = useState(null);
// //     const [isBottomSheetFixed, setIsBottomSheetFixed] = useState(false);
// //
// //     const { lockers, loading, error, fetchLockers } = useLockers();
// //
// //     // 공통 API 호출 함수
// //     const fetchLockerData = async (params) => {
// //         try {
// //             const data = await searchLockers(params);
// //             console.log("검색 결과:", data);
// //             // 여기서 바로 setLockers(data) 같은 식으로 상태 업데이트
// //         } catch (err) {
// //             console.error("락커 데이터를 불러오는 중 오류 발생:", err);
// //         }
// //     };
// //
// //     useEffect(() => {
// //         fetchLockerData({ address, jimTypeId, reservationDate, lockerName });
// //     }, [ address, jimTypeId, reservationDate, lockerName]);
// //
// //     const handleBagTypeChange = async (newJimTypeId) => {
// //         setJimTypeId(newJimTypeId);
// //
// //         // URL 갱신
// //         const url = new URL(window.location.href);
// //         url.searchParams.set("address", newJimTypeId);
// //         url.searchParams.set("jimTypeId", newJimTypeId);
// //         url.searchParams.set("reservationDate", reservationDate);
// //         url.searchParams.set("lockerName", lockerName);
// //         window.history.replaceState({}, '', url.toString());
// //
// //         // 데이터 재호출
// //         await fetchLockerData({ address, jimTypeId, reservationDate, lockerName });
// //     };
// //
// //     const handleMarkerClick = (lockerId) => {
// //         setSelectedLockerId(prev => prev === lockerId ? null : lockerId);
// //     };
// //
// //     const handleLockerSelect = (lockerId) => {
// //         setSelectedLockerId(prev => prev === lockerId ? null : lockerId);
// //     };
// //
// //     const handleBottomSheetToggle = (isFixed) => {
// //         setIsBottomSheetFixed(isFixed);
// //     };
// //
// //     return (
// //         <>
// //             <SearchControls
// //                 address={address}
// //                 reservationDate={reservationDate}
// //                 jimTypeId={jimTypeId}
// //                 lockerName={lockerName}
// //                 onBagTypeChange={handleBagTypeChange}
// //                 currentBagType={jimTypeId}
// //             />
// //
// //             <MapContainer
// //                 lockers={lockers}
// //                 selectedLockerId={selectedLockerId}
// //                 onMarkerClick={handleMarkerClick}
// //                 isBottomSheetFixed={isBottomSheetFixed}
// //             />
// //
// //             <BottomSheet
// //                 lockers={lockers}
// //                 isFixed={isBottomSheetFixed}
// //                 onToggle={handleBottomSheetToggle}
// //                 selectedLockerId={selectedLockerId}
// //                 onLockerSelect={handleLockerSelect}
// //             />
// //         </>
// //     );
// // };
// //
// // export default MapApp;
//
// import React, { useState, useEffect } from 'react';
// import MapContainer from './MapContainer';
// import BottomSheet from './BottomSheet';
// import SearchControls from './SearchControls';
// import { useLockers } from '../../../hooks/useLockers';
// import { searchLockers } from "../../../api/lockerApi";
// import { useLocation } from "react-router-dom";
//
// const MapApp = () => {
//     const location = useLocation();
//     const urlParams = new URLSearchParams(location.search);
//     const initialAddress = urlParams.get("address") || "";
//     const initialJimTypeId = urlParams.get("jimTypeId") || "0";
//
//     const [address, setAddress] = useState(initialAddress);
//     const [jimTypeId, setJimTypeId] = useState(initialJimTypeId);
//     const [lockerName, setLockerName] = useState(urlParams.get("lockerName") || "");
//     const [selectedLockerId, setSelectedLockerId] = useState(null);
//     const [isBottomSheetFixed, setIsBottomSheetFixed] = useState(false);
//
//     const { lockers, loading, error, fetchLockers } = useLockers();
//
//     const fetchLockerData = async (params) => {
//         try {
//             const data = await searchLockers(params);
//             console.log("검색 결과:", data);
//             // 필요하다면 fetchLockers(data) 또는 setLockers(data) 호출
//         } catch (err) {
//             console.error("락커 데이터를 불러오는 중 오류 발생:", err);
//         }
//     };
//
//     useEffect(() => {
//         fetchLockerData({ address, jimTypeId, lockerName });
//     }, [address, jimTypeId, lockerName]);
//
//     const handleBagTypeChange = async (newJimTypeId) => {
//         setJimTypeId(newJimTypeId);
//
//         // URL 갱신 (address는 그대로 유지)
//         const url = new URL(window.location.href);
//         url.searchParams.set("address", address);
//         url.searchParams.set("jimTypeId", newJimTypeId);
//         url.searchParams.set("lockerName", lockerName);
//         window.history.replaceState({}, '', url.toString());
//
//         await fetchLockerData({ address, jimTypeId: newJimTypeId, lockerName });
//     };
//
//     const handleMarkerClick = (lockerId) => {
//         setSelectedLockerId(prev => prev === lockerId ? null : lockerId);
//     };
//
//     const handleLockerSelect = (lockerId) => {
//         setSelectedLockerId(prev => prev === lockerId ? null : lockerId);
//     };
//
//     const handleBottomSheetToggle = (isFixed) => {
//         setIsBottomSheetFixed(isFixed);
//     };
//
//     return (
//         <>
//             <SearchControls
//                 address={address}
//                 jimTypeId={jimTypeId}
//                 lockerName={lockerName}
//                 onBagTypeChange={handleBagTypeChange}
//                 currentBagType={jimTypeId}
//             />
//
//             <MapContainer
//                 lockers={lockers}
//                 selectedLockerId={selectedLockerId}
//                 onMarkerClick={handleMarkerClick}
//                 isBottomSheetFixed={isBottomSheetFixed}
//             />
//
//             <BottomSheet
//                 lockers={lockers}
//                 isFixed={isBottomSheetFixed}
//                 onToggle={handleBottomSheetToggle}
//                 selectedLockerId={selectedLockerId}
//                 onLockerSelect={handleLockerSelect}
//             />
//         </>
//     );
// };
//
// export default MapApp;

import React, { useState, useEffect } from 'react';
import MapContainer from './MapContainer';
import BottomSheet from './BottomSheet';
import SearchControls from './SearchControls';
import { useLockers } from '../../../hooks/useLockers';
import { useLocation } from "react-router-dom";

const MapApp = () => {
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const initialAddress = urlParams.get("address") || "";
    const initialJimTypeId = urlParams.get("jimTypeId") || "0";

    const [address, setAddress] = useState(initialAddress);
    const [jimTypeId, setJimTypeId] = useState(initialJimTypeId);
    const [lockerName, setLockerName] = useState(urlParams.get("lockerName") || "");
    const [selectedLockerId, setSelectedLockerId] = useState(null);
    const [isBottomSheetFixed, setIsBottomSheetFixed] = useState(false);

    const { lockers, loading, error, fetchLockers } = useLockers();

    // 🔹 API 호출 (useLockers 사용)
    useEffect(() => {
        fetchLockers({ address, jimTypeId, lockerName });
    }, [address, jimTypeId, lockerName]);

    const handleBagTypeChange = async (newJimTypeId) => {
        setJimTypeId(newJimTypeId);

        // URL 갱신
        const url = new URL(window.location.href);
        url.searchParams.set("address", address);
        url.searchParams.set("jimTypeId", newJimTypeId);
        // url.searchParams.set("lockerName", lockerName);
        window.history.replaceState({}, '', url.toString());

        // 데이터 재호출
        await fetchLockers({ address, jimTypeId: newJimTypeId });
    };

    const handleMarkerClick = (lockerId) => {
        setSelectedLockerId(prev => prev === lockerId ? null : lockerId);
    };

    const handleLockerSelect = (lockerId) => {
        setSelectedLockerId(prev => prev === lockerId ? null : lockerId);
    };

    const handleBottomSheetToggle = (isFixed) => {
        setIsBottomSheetFixed(isFixed);
    };

    return (
        <>
            <SearchControls
                address={address}
                jimTypeId={jimTypeId}
                lockerName={lockerName}
                onBagTypeChange={handleBagTypeChange}
                currentBagType={jimTypeId}
            />

            <MapContainer
                lockers={lockers}
                selectedLockerId={selectedLockerId}
                onMarkerClick={handleMarkerClick}
                isBottomSheetFixed={isBottomSheetFixed}
            />

            <BottomSheet
                lockers={lockers}
                isFixed={isBottomSheetFixed}
                onToggle={handleBottomSheetToggle}
                selectedLockerId={selectedLockerId}
                onLockerSelect={handleLockerSelect}
            />

            {/* 로딩/에러 상태 표시 (선택사항) */}
            {loading && <div>불러오는 중...</div>}
            {error && <div style={{ color: "red" }}>에러 발생: {error}</div>}
        </>
    );
};

export default MapApp;
