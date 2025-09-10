import React, {useState, useEffect, useMemo} from 'react';
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
    const [jimTypeId, setJimTypeId] = useState(Number(initialJimTypeId));
    const [lockerName, setLockerName] = useState(urlParams.get("lockerName") || "");
    const [selectedLockerId, setSelectedLockerId] = useState(null);
    const [isBottomSheetFixed, setIsBottomSheetFixed] = useState(false);
    const { lockers, loading, error, fetchLockers } = useLockers();
    const filteredLockers = lockers;

    useEffect(() => {
        // 방법 1: 서버에서 jimTypeId=0일 때 필터링하지 않도록 요청
        const fetchParams = {
            address,
            lockerName,
            // jimTypeId가 0이 아닐 때만 포함
            ...(jimTypeId !== 0 && { jimTypeId: jimTypeId.toString() })
        };

        fetchLockers(fetchParams);

    }, [address, lockerName, jimTypeId]);

    const handleBagTypeChange = async (newJimTypeId) => {
        const numbericJimTypeId = Number(newJimTypeId);
        setJimTypeId(numbericJimTypeId);

        // URL 갱신
        const url = new URL(window.location.href);
        url.searchParams.set("address", address);
        url.searchParams.set("lockerName", lockerName);
        url.searchParams.set("jimTypeId", numbericJimTypeId.toString());
        window.history.replaceState({}, '', url.toString());
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

    useEffect(() => {
        setSelectedLockerId(null);
    }, [jimTypeId]);

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
                lockers={filteredLockers}
                selectedLockerId={selectedLockerId}
                onMarkerClick={handleMarkerClick}
                isBottomSheetFixed={isBottomSheetFixed}
            />

            <BottomSheet
                lockers={filteredLockers}
                isFixed={isBottomSheetFixed}
                onToggle={handleBottomSheetToggle}
                selectedLockerId={selectedLockerId}
                onLockerSelect={handleLockerSelect}
                currentJimTypeId={jimTypeId}
                onJimTypeChange={handleBagTypeChange}
            />

            {loading && <div>불러오는 중...</div>}
            {error && <div style={{ color: "red" }}>에러 발생: {error}</div>}
        </>
    );
};

export default MapApp;