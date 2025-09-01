import React, { useEffect, useCallback } from 'react';
import { useMap } from '../../../hooks/useMap';
import "../../../styles/pages/search.css";

const MapContainer = ({
                          lockers,
                          selectedLockerId,
                          onMarkerClick,
                          contextPath,
                          isBottomSheetFixed
                      }) => {
    const {
        mapRef,
        mapInstanceRef,
        markersRef,
        infoWindowsRef,
        isMapReady,
        clearMarkers,
        createMarkerImage,
        createInfoWindowTemplate
    } = useMap(contextPath);

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
        <div ref={mapRef} id="map"/>
    );
};

export default MapContainer;