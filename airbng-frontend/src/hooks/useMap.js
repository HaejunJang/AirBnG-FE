import { useState, useEffect, useRef, useCallback } from 'react';

export const useMap = () => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const infoWindowsRef = useRef([]);

    const [isMapReady, setIsMapReady] = useState(false);

    // 카카오 스크립트 로더
    const loadKakaoScript = useCallback(async () => {
        return new Promise((resolve, reject) => {
            try {
                const existingScript = document.querySelector("script[src*='dapi.kakao.com']");
                if (!existingScript) {
                    const script = document.createElement("script");
                    const KEY = process.env.REACT_APP_KAKAO_APP_KEY;
                    // console.log("카카오 키:", appKey);
                    if (!KEY) {
                        console.error("Kakao App Key가 .env에 설정되지 않았습니다.");
                        reject("Missing Kakao App Key");
                        return;
                    }
                    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false&libraries=services`;
                    script.onload = () => window.kakao.maps.load(resolve);
                    document.head.appendChild(script);
                } else {
                    window.kakao.maps.load(resolve);
                }
            } catch (err) {
                reject(err);
            }
        });
    }, []);

    // 지도 초기화
    useEffect(() => {
        const initMap = async () => {
            try {
                await loadKakaoScript();

                if (mapRef.current) {
                    const mapOption = {
                        center: new window.kakao.maps.LatLng(
                            37.55935630141197, // 기본 위도
                            126.92263348592226 // 기본 경도
                        ),
                        level: 4,
                    };

                    mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, mapOption);

                    setIsMapReady(true);
                }
            } catch (error) {
                console.error("지도 초기화 실패:", error);
            }
        };

        initMap();
    }, [loadKakaoScript]);


    // 마커 정리
    const clearMarkers = useCallback(() => {
        markersRef.current.forEach(marker => marker.setMap(null));
        infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
        markersRef.current = [];
        infoWindowsRef.current = [];
    }, []);

    // 마커 이미지 생성
    const createMarkerImage = useCallback((isAvailable) => {
        const imageSrc = isAvailable === 'YES'
            ? `/assets/marker-available.svg`
            : `/assets/marker-unavailable.svg`;

        const imageSize = new window.kakao.maps.Size(28, 32);
        const imageOption = { offset: new window.kakao.maps.Point(12, 35) };

        return new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
    }, []);

    return {
        mapRef,
        mapInstanceRef,
        markersRef,
        infoWindowsRef,
        isMapReady,
        clearMarkers,
        createMarkerImage
    };
};
export default useMap;