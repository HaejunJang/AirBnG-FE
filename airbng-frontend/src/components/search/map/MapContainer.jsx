import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMap } from '../../../hooks/useMap';
import "../../../styles/pages/search.css";

const MapContainer = ({
                          lockers,
                          selectedLockerId,
                          onMarkerClick,
                          isBottomSheetFixed
                      }) => {
    const navigate = useNavigate();
    const {
        mapRef,
        mapInstanceRef,
        markersRef,
        infoWindowsRef,
        isMapReady,
        clearMarkers,
        createMarkerImage
    } = useMap();

    // 상세보기 네비게이션 핸들러
    const handleDetailNavigation = useCallback((lockerId) => {
        navigate(`/page/lockerDetails?lockerId=${encodeURIComponent(lockerId)}`);
    }, [navigate]);

    // 인포윈도우 템플릿 생성
    const createInfoWindowTemplate = useCallback((locker) => {
        const { lockerName, lockerId, isAvailable, address, url } = locker;
        const imageUrl = url || `/assets/default.jpg`;
        const availabilityText = isAvailable === 'YES' ? '보관가능' : '보관대기';
        const availabilityColor = isAvailable === 'YES' ? '#4CAF50' : '#ff9800';

        return `
            <div class="info-window">
                <div class="info-window-image" style="background-image: url('${imageUrl}');">
                    <div class="info-window-availability" style="background: ${availabilityColor};">
                        ${availabilityText}
                    </div>
                </div>
                <div class="info-window-content">
                    <div class="info-window-title">${lockerName}</div>
                    <div class="info-window-address">${address || '주소 정보 없음'}</div>
                    <button
                        class="info-window-button"
                        data-locker-id="${lockerId}"
                    >
                        상세보기
                    </button>
                </div>
            </div>
        `;
    }, []);

    // 인포윈도우 버튼 클릭 이벤트 처리
    const handleInfoWindowClick = useCallback((event) => {
        if (event.target.classList.contains('info-window-button')) {
            const lockerId = event.target.getAttribute('data-locker-id');
            if (lockerId) {
                handleDetailNavigation(lockerId);
            }
        }
    }, [handleDetailNavigation]);

    // 마커 렌더링
    const renderMarkers = useCallback(() => {
        if (!mapInstanceRef.current || !lockers || lockers.length === 0) return;

        clearMarkers();

        lockers.forEach((locker, index) => {
            const { latitude, longitude, lockerName, lockerId, isAvailable } = locker;

            if (latitude && longitude) {
                const position = new window.kakao.maps.LatLng(parseFloat(latitude), parseFloat(longitude));
                const markerImage = createMarkerImage(isAvailable);

                const marker = new window.kakao.maps.Marker({
                    map: mapInstanceRef.current,
                    position: position,
                    title: lockerName,
                    image: markerImage
                });

                markersRef.current.push(marker);

                const infowindow = new window.kakao.maps.InfoWindow({
                    content: createInfoWindowTemplate(locker),
                    removable: true,
                });

                infoWindowsRef.current.push(infowindow);

                // 마커 클릭 이벤트
                window.kakao.maps.event.addListener(marker, 'click', () => {
                    const isOpen = infowindow.getMap();

                    if (isOpen) {
                        infowindow.close();
                    } else {
                        // 모든 인포윈도우 닫기
                        infoWindowsRef.current.forEach(iw => iw.close());
                        infowindow.open(mapInstanceRef.current, marker);

                        const position = marker.getPosition();
                        let offsetLat = 0.0001;

                        if (isBottomSheetFixed) {
                            const mapContainer = mapRef.current;
                            const mapHeight = mapContainer.offsetHeight;
                            const sheetHeight = mapHeight * 0.6;
                            const sheetRatio = sheetHeight / mapHeight;
                            const bounds = mapInstanceRef.current.getBounds();
                            const latRange = bounds.getNorthEast().getLat() - bounds.getSouthWest().getLat();
                            offsetLat = latRange * sheetRatio * -0.2;
                        }

                        const adjustedPosition = new window.kakao.maps.LatLng(
                            position.getLat() + offsetLat,
                            position.getLng()
                        );

                        mapInstanceRef.current.panTo(adjustedPosition);
                        setTimeout(() => {
                            mapInstanceRef.current.setLevel(3);
                        }, 300);

                        onMarkerClick(lockerId);
                    }
                });
            }
        });

        // 지도 범위 조정
        if (lockers.length > 0) {
            const bounds = new window.kakao.maps.LatLngBounds();
            lockers.forEach(locker => {
                if (locker.latitude && locker.longitude) {
                    const position = new window.kakao.maps.LatLng(parseFloat(locker.latitude), parseFloat(locker.longitude));
                    bounds.extend(position);
                }
            });
            mapInstanceRef.current.setBounds(bounds);
        }
    }, [lockers, clearMarkers, createMarkerImage, createInfoWindowTemplate, isBottomSheetFixed, onMarkerClick]);

    // 선택된 락커로 이동
    const moveToLocker = useCallback((lockerId) => {
        if (!mapInstanceRef.current) return;

        const targetLocker = lockers.find(locker => String(locker.lockerId) === String(lockerId));
        if (!targetLocker || !targetLocker.latitude || !targetLocker.longitude) return;

        const markerIndex = lockers.findIndex(locker => String(locker.lockerId) === String(lockerId));
        if (markerIndex === -1) return;

        const lat = parseFloat(targetLocker.latitude);
        const lng = parseFloat(targetLocker.longitude);

        let offsetLat = 0.0001;
        if (isBottomSheetFixed) {
            const mapContainer = mapRef.current;
            const mapHeight = mapContainer.offsetHeight;
            const sheetHeight = mapHeight * 0.6;
            const sheetRatio = sheetHeight / mapHeight;
            const bounds = mapInstanceRef.current.getBounds();
            const latRange = bounds.getNorthEast().getLat() - bounds.getSouthWest().getLat();
            offsetLat = latRange * sheetRatio * -0.2;
        }

        const adjustedPosition = new window.kakao.maps.LatLng(lat + offsetLat, lng);
        mapInstanceRef.current.setLevel(3);
        mapInstanceRef.current.panTo(adjustedPosition);

        // 인포윈도우 열기
        infoWindowsRef.current.forEach(iw => iw.close());
        if (markersRef.current[markerIndex] && infoWindowsRef.current[markerIndex]) {
            setTimeout(() => {
                infoWindowsRef.current[markerIndex].open(mapInstanceRef.current, markersRef.current[markerIndex]);
            }, 300);
        }
    }, [lockers, isBottomSheetFixed]);

    // 지도 컨테이너 클릭 이벤트 (인포윈도우 버튼 처리)
    useEffect(() => {
        const mapContainer = mapRef.current;
        if (mapContainer) {
            mapContainer.addEventListener('click', handleInfoWindowClick);
            return () => {
                mapContainer.removeEventListener('click', handleInfoWindowClick);
            };
        }
    }, [handleInfoWindowClick]);

    useEffect(() => {
        if (isMapReady) {
            renderMarkers();
        }
    }, [isMapReady, renderMarkers]);

    useEffect(() => {
        if (selectedLockerId && isMapReady) {
            moveToLocker(selectedLockerId);
        }
    }, [selectedLockerId, moveToLocker, isMapReady]);

    useEffect(() => {
        if (isMapReady && mapInstanceRef.current) {
            window.kakao.maps.event.trigger(mapInstanceRef.current, "resize");
        }
    }, [isMapReady]);

    return (
        <div ref={mapRef} id="map" />
    );
};

export default MapContainer;