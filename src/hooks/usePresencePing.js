import { useEffect, useRef } from 'react';
import { pingPresence } from '../api/chatApi';

export default function usePresencePing({ intervalMs = 25000 } = {}) {
  const ticking = useRef(false);

  useEffect(() => {
    let id;
    const tick = async () => {
      if (ticking.current) return;
      try {
        ticking.current = true;
        await pingPresence();
      } catch (e) {
        // 무시: 네트워크 에러일 땐 다음 틱에서 다시 시도
      } finally {
        ticking.current = false;
      }
    };

    // 첫 진입 시 한 번
    tick();

    // 정기 핑
    if (intervalMs > 0) {
      id = setInterval(tick, intervalMs);
    }

    // 탭 활성화 시 즉시 핑
    const onVis = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      if (id) clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [intervalMs]);
}
