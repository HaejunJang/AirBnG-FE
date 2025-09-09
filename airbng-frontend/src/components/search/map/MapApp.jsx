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

    useEffect(() => {
        fetchLockers({ address, lockerName, jimTypeId });
    }, [address, lockerName, jimTypeId]);

    const handleBagTypeChange = async (newJimTypeId) => {
        setJimTypeId(newJimTypeId);

        // URL 갱신
        const url = new URL(window.location.href);
        url.searchParams.set("address", address);
        url.searchParams.set("lockerName", lockerName);
        url.searchParams.set("jimTypeId", newJimTypeId);
        window.history.replaceState({}, '', url.toString());

        // 데이터 재호출
        await fetchLockers({ address, lockerName, jimTypeId: newJimTypeId });
    };

    const handleMarkerClick = (lockerId) => {
        setSelectedLockerId(prev => prev === lockerId ? null : lockerId);
    };

    const handleLockerSelect = (lockerId) => {
        setSelectedLockerId(lockerId);
    };

    const handleBottomSheetToggle = (isFixed) => {
        setIsBottomSheetFixed(isFixed);
    };

    return (
        <>
            <SearchControls
                address={address}
                lockerName={lockerName}
                jimTypeId={jimTypeId}
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
