import React, { useState, useEffect } from 'react';
import MapContainer from './MapContainer';
import BottomSheet from './BottomSheet';
import SearchControls from './SearchControls';
import { useLockers } from '../../../hooks/useLockers';
import {searchLockers} from "../../../api/lockerApi";

const MapApp = () => {
    const contextPath = window.contextPath || '';

    const urlParams = new URLSearchParams(window.location.search);
    const initialAddress = urlParams.get("address") || "";
    const initialReservationDate = urlParams.get("reservationDate") || new Date().toISOString().split("T")[0];
    const initialJimTypeId = urlParams.get("jimTypeId") || "0";

    const [address, setAddress] = useState(initialAddress);
    const [reservationDate, setReservationDate] = useState(initialReservationDate);
    const [jimTypeId, setJimTypeId] = useState(initialJimTypeId);
    const [selectedLockerId, setSelectedLockerId] = useState(null);
    const [isBottomSheetFixed, setIsBottomSheetFixed] = useState(false);

    const { lockers, loading, error, fetchLockers } = useLockers(contextPath);

    // 공통 API 호출 함수
    const fetchLockerData = async ({ address, lockerName = "", jimTypeId, reservationDate }) => {
        try {
            const res = await searchLockers({ address, lockerName, jimTypeId, reservationDate });
            await fetchLockers(res.data);
        } catch (err) {
            console.error("락커 데이터를 불러오는 중 오류 발생:", err);
        }
    };

    useEffect(() => {
        fetchLockerData({ address, jimTypeId, reservationDate });
    }, []);

    const handleBagTypeChange = async (newJimTypeId) => {
        setJimTypeId(newJimTypeId);

        // URL 갱신
        const url = new URL(window.location.href);
        url.searchParams.set("jimTypeId", newJimTypeId);
        url.searchParams.set("reservationDate", reservationDate);
        window.history.replaceState({}, '', url.toString());

        // 데이터 재호출
        await fetchLockerData({ address, jimTypeId: newJimTypeId, reservationDate });
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
                reservationDate={reservationDate}
                jimTypeId={jimTypeId}
                onBagTypeChange={handleBagTypeChange}
                currentBagType={jimTypeId}
                contextPath={contextPath}
            />

            <MapContainer
                lockers={lockers}
                selectedLockerId={selectedLockerId}
                onMarkerClick={handleMarkerClick}
                contextPath={contextPath}
                isBottomSheetFixed={isBottomSheetFixed}
            />

            <BottomSheet
                lockers={lockers}
                isFixed={isBottomSheetFixed}
                onToggle={handleBottomSheetToggle}
                selectedLockerId={selectedLockerId}
                onLockerSelect={handleLockerSelect}
                contextPath={contextPath}
            />
        </>
    );
};

export default MapApp;