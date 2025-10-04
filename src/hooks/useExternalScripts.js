import { useEffect, useState } from 'react';

const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
        if (existing.getAttribute('data-loaded')) return resolve();
        existing.addEventListener('load', resolve);
        return;
    }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.setAttribute('data-loaded', 'true');
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
});

export function useDaumPostcode() {
    const [ready, setReady] = useState(!!window.daum?.Postcode);
    useEffect(() => {
        let mounted = true;
        if (window.daum?.Postcode) return;
        loadScript('https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js')
            .then(() => { if (mounted) setReady(true); });
        return () => { mounted = false; };
    }, []);
    return ready;
}

export function useKakaoGeocoder() {
    const [ready, setReady] = useState(!!window.kakao?.maps?.services);
    useEffect(() => {
        let mounted = true;
        if (window.kakao?.maps?.services) return;
        const KEY = process.env.REACT_APP_KAKAO_APP_KEY;
        const src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false&libraries=services`;
        loadScript(src).then(() => {
            window.kakao.maps.load(() => { if (mounted) setReady(true); });
        });
        return () => { mounted = false; };
    }, []);
    return ready;
}