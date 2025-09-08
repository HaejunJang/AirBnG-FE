import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMap } from '../../../hooks/useMap';
import "../../../styles/pages/search.css";
import CurrentLocation from "../../../assets/icon.gif";
import imgUpload from "../../../assets/img_upload_ic.svg";

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
        const imageUrl = url || imgUpload;
        const availabilityText = isAvailable === 'YES' ? '보관가능' : '보관대기';
        const availabilityColor = isAvailable === 'YES' ? '#4CAF50' : '#ff9800';

        return `
            <div class="info-window">
                <div class="info-window-image" style="background-image: url('${imageUrl}');">
                    <div class="info-window-availability" style="background-color: ${availabilityColor};">
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

    const renderCurrentLocation = useCallback(() => {
        if (!mapInstanceRef.current) return;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                const currentPosition = new window.kakao.maps.LatLng(lat, lng);

                const marker = new window.kakao.maps.Marker({
                    map: mapInstanceRef.current,
                    position: currentPosition,
                    title: "현재 위치",
                    image: new window.kakao.maps.MarkerImage(
                        CurrentLocation, // 현재위치 아이콘 (직접 준비)
                        new window.kakao.maps.Size(32, 32),
                        { offset: new window.kakao.maps.Point(16, 32) }
                    )
                });

                // 현재 위치로 지도 이동
                mapInstanceRef.current.panTo(currentPosition);
            });
        } else {
            alert("위치 정보를 사용할 수 없습니다.");
        }
    }, [mapInstanceRef]);

    // 인포윈도우 버튼 클릭 이벤트 처리
    const handleInfoWindowClick = useCallback((event) => {
        if (event.target.classList.contains('info-window-button')) {
            const lockerId = event.target.getAttribute('data-locker-id');
            if (lockerId) {
                handleDetailNavigation(lockerId);
            }
        }
    }, [handleDetailNavigation]);

    // 마커 위치 조정 계산 함수
    const calculateOffsetPosition = useCallback((markerPosition) => {
        if (!mapInstanceRef.current || !mapRef.current) return markerPosition;

        const mapContainer = mapRef.current;
        const mapHeight = mapContainer.offsetHeight;
        const bounds = mapInstanceRef.current.getBounds();
        const latRange = bounds.getNorthEast().getLat() - bounds.getSouthWest().getLat();

        let offsetLat = 0;

        // 상단 검색창 높이 고려 (대략 60px 정도로 가정)
        const searchBarHeight = 60;
        const searchBarRatio = searchBarHeight / mapHeight;

        if (isBottomSheetFixed) {
            // 바텀시트가 고정된 경우
            const sheetHeight = mapHeight * 0.6; // 바텀시트가 차지하는 높이
            const totalOccupiedHeight = searchBarHeight + sheetHeight;
            const availableHeight = mapHeight - totalOccupiedHeight;

            // 사용 가능한 영역의 중앙으로 조정
            const targetRatio = (searchBarHeight + availableHeight * 0.4) / mapHeight;
            offsetLat = latRange * (0.5 - targetRatio);
        } else {
            // 바텀시트가 없는 경우, 검색창만 고려
            const targetRatio = (searchBarHeight + 100) / mapHeight; // 인포윈도우 높이도 고려
            offsetLat = latRange * (0.5 - targetRatio);
        }

        return new window.kakao.maps.LatLng(
            markerPosition.getLat() + offsetLat,
            markerPosition.getLng()
        );
    }, [isBottomSheetFixed, mapRef, mapInstanceRef]);

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

                        const markerPosition = marker.getPosition();
                        const adjustedPosition = calculateOffsetPosition(markerPosition);

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
    }, [lockers, clearMarkers, createMarkerImage, createInfoWindowTemplate, onMarkerClick, calculateOffsetPosition]);

    // 선택된 락커로 이동
    const moveToLocker = useCallback((lockerId) => {
        if (!mapInstanceRef.current) return;

        const targetLocker = lockers.find(locker => String(locker.lockerId) === String(lockerId));
        if (!targetLocker || !targetLocker.latitude || !targetLocker.longitude) return;

        const markerIndex = lockers.findIndex(locker => String(locker.lockerId) === String(lockerId));
        if (markerIndex === -1) return;

        const lat = parseFloat(targetLocker.latitude);
        const lng = parseFloat(targetLocker.longitude);

        const markerPosition = new window.kakao.maps.LatLng(lat, lng);
        const adjustedPosition = calculateOffsetPosition(markerPosition);

        mapInstanceRef.current.setLevel(3);
        mapInstanceRef.current.panTo(adjustedPosition);

        // 인포윈도우 열기
        infoWindowsRef.current.forEach(iw => iw.close());
        if (markersRef.current[markerIndex] && infoWindowsRef.current[markerIndex]) {
            setTimeout(() => {
                infoWindowsRef.current[markerIndex].open(mapInstanceRef.current, markersRef.current[markerIndex]);
            }, 300);
        }
    }, [lockers, calculateOffsetPosition]);

    useEffect(() => {
        if (isMapReady) {
            renderMarkers();         // 기존 락커 마커들 표시
            renderCurrentLocation(); // 현재 위치 마커 표시
        }
    }, [isMapReady, renderMarkers, renderCurrentLocation]);

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