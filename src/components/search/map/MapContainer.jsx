import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMap } from '../../../hooks/useMap';
import "../../../styles/pages/search.css";
import CurrentLocation from "../../../assets/icon.gif";
import { useModal, Modal } from '../../common/ModalUtil';

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

  const modal = useModal();
  const currentLocationMarkerRef = useRef(null);

  const handleDetailNavigation = useCallback((lockerId) => {
    navigate(`/page/lockers/${lockerId}`);
  }, [navigate]);

  const createInfoWindowTemplate = useCallback((locker) => {
    const { lockerName, lockerId, isAvailable, address, url } = locker;
    const imageUrl = url || `/assets/default.jpg`;
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
          ${
            isAvailable === 'YES'
                ? `<button class="info-window-button" data-locker-id="${lockerId}">상세보기</button>`
                : `<div class="info-window-waiting">보관대기</div>`
          }
          </button>
        </div>
      </div>
    `;
  }, []);

  const renderCurrentLocation = useCallback(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const currentPos = new window.kakao.maps.LatLng(lat, lng);

        if (currentLocationMarkerRef.current) {
          currentLocationMarkerRef.current.setMap(null);
        }

        const marker = new window.kakao.maps.Marker({
          position: currentPos,
          title: "현재 위치",
          image: new window.kakao.maps.MarkerImage(
            CurrentLocation,
            new window.kakao.maps.Size(32, 32),
            { offset: new window.kakao.maps.Point(16, 32) }
          )
        });
        marker.setMap(map);
        currentLocationMarkerRef.current = marker;

        if (!selectedLockerId) {
          const bounds = new window.kakao.maps.LatLngBounds();
          bounds.extend(currentPos);
          markersRef.current.forEach(m => bounds.extend(m.getPosition()));
          map.setBounds(bounds);
        }
      });
    } else {
      modal.showError("위치 정보 오류", "위치 정보를 사용할 수 없습니다.");
    }
  }, [markersRef, selectedLockerId, modal]);

  const handleInfoWindowClick = useCallback((event) => {
    if (event.target.classList.contains('info-window-button')) {
      const lockerId = event.target.getAttribute('data-locker-id');
      if (lockerId) {
        handleDetailNavigation(lockerId);
      }
    }
  }, [handleDetailNavigation]);

  const calculateOffset = useCallback((forceCheck = false) => {
    if (!mapInstanceRef.current) return 0;

    const bounds = mapInstanceRef.current.getBounds();
    const latRange = bounds.getNorthEast().getLat() - bounds.getSouthWest().getLat();
    const bottomSheet = document.getElementById('bottomSheet');

    if (bottomSheet) {
      if (forceCheck) {
        const computedStyle = window.getComputedStyle(bottomSheet);
        const hasFixedClass = bottomSheet.classList.contains('fixed');

        if (hasFixedClass) {
          return latRange * (-0.08);
        } else {
          return latRange * (-0.01);
        }
      } else {
        const hasFixedClass = bottomSheet.classList.contains('fixed');

        if (hasFixedClass) {
          return latRange * (-0.08);
        } else {
          return latRange * (-0.01);
        }
      }
    }

    return latRange * 0.15;
  }, []);

  const renderMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !lockers || lockers.length === 0) return;

    clearMarkers();

    lockers.forEach((locker) => {
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

        window.kakao.maps.event.addListener(marker, 'click', () => {
          const isOpen = infowindow.getMap();

          if (isOpen) {
            infowindow.close();
          } else {
            infoWindowsRef.current.forEach(iw => iw.close());
            infowindow.open(mapInstanceRef.current, marker);

            const position = marker.getPosition();
            const lat = position.getLat();
            const lng = position.getLng();

            const offsetLat = calculateOffset();
            const adjustedPosition = new window.kakao.maps.LatLng(lat + offsetLat, lng);

            mapInstanceRef.current.setLevel(3);
            setTimeout(() => {
              mapInstanceRef.current.panTo(adjustedPosition);
            }, 100);

            onMarkerClick(lockerId);
          }
        });
      }
    });

    if (lockers.length > 0 && !selectedLockerId) {
      const bounds = new window.kakao.maps.LatLngBounds();
      lockers.forEach(locker => {
        if (locker.latitude && locker.longitude) {
          const position = new window.kakao.maps.LatLng(parseFloat(locker.latitude), parseFloat(locker.longitude));
          bounds.extend(position);
        }
      });
      mapInstanceRef.current.setBounds(bounds);
    }
  }, [lockers, clearMarkers, createMarkerImage, createInfoWindowTemplate, onMarkerClick, selectedLockerId, calculateOffset]);

  const moveToLocker = useCallback((lockerId) => {
    if (!mapInstanceRef.current) return;

    const targetLocker = lockers.find(locker => String(locker.lockerId) === String(lockerId));
    if (!targetLocker || !targetLocker.latitude || !targetLocker.longitude) return;

    const markerIndex = lockers.findIndex(locker => String(locker.lockerId) === String(lockerId));
    if (markerIndex === -1) return;

    const lat = parseFloat(targetLocker.latitude);
    const lng = parseFloat(targetLocker.longitude);

    mapInstanceRef.current.setLevel(3);

    window.kakao.maps.event.trigger(mapInstanceRef.current, "resize");

    setTimeout(() => {
      const offsetLat = calculateOffset(true);
      const adjustedPosition = new window.kakao.maps.LatLng(lat + offsetLat, lng);

      mapInstanceRef.current.panTo(adjustedPosition);

      infoWindowsRef.current.forEach(iw => iw.close());
      if (markersRef.current[markerIndex] && infoWindowsRef.current[markerIndex]) {
        setTimeout(() => {
          infoWindowsRef.current[markerIndex].open(mapInstanceRef.current, markersRef.current[markerIndex]);
        }, 200);
      }
    }, 100);

  }, [lockers, calculateOffset]);

  useEffect(() => {
    if (isMapReady) {
      renderMarkers();
      renderCurrentLocation();
    }
  }, [isMapReady, renderMarkers, renderCurrentLocation]);

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
    if (selectedLockerId && isMapReady) {
      moveToLocker(selectedLockerId);
    }
  }, [selectedLockerId, moveToLocker, isMapReady]);

  useEffect(() => {
    if (isMapReady && mapInstanceRef.current) {
      setTimeout(() => {
        window.kakao.maps.event.trigger(mapInstanceRef.current, "resize");
      }, 50);
    }
  }, [isMapReady, isBottomSheetFixed]);

  return (
    <>
      <div ref={mapRef} id="map" />
      <Modal {...modal.modalState} onClose={modal.hideModal} />
    </>
  );
};

export default MapContainer;
