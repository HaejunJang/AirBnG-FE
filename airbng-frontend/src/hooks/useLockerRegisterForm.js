import { useCallback, useEffect, useMemo, useState } from 'react';
import { registerLocker } from '../api/lockerApi';
import { getJimTypes } from '../api/jimTypeApi';

export default function useLockerRegisterForm({ keeperId }) {
  // step
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [hostName, setHostName] = useState('');       
  const [lockerName, setLockerName] = useState('');
  const [address, setAddress] = useState('');
  const [addressEnglish, setAddressEnglish] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [latitude, setLat] = useState(null);
  const [longitude, setLng] = useState(null);
  const [images, setImages] = useState([]);
  const [startTime, setStartTime] = useState('08:00'); // UI용 (서버 아직 미사용)
  const [endTime, setEndTime] = useState('21:00');     // UI용 (서버 아직 미사용)

  // 짐 타입 (서버에 존재하는 고정 5개 id에 맞춰 초기화)
  const [jim, setJim] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getJimTypes();
        const list = res.data?.result ?? [];
        const mapped = list.map((t, idx) => ({
          id: t.jimTypeId,
          label: t.typeName,
          price: Number(t.pricePerHour),
          selected: idx < 3,
        }));
        setJim(mapped);
      } catch (e) {
        console.error('Failed to load jim types', e);
        setJim([]);
      }
    })();
  }, []);

  const canNext = useMemo(() => {
    if (step === 1) return hostName.trim().length > 0 && hostName.length <= 10;
    if (step === 2) return !!lockerName && !!address && latitude != null && longitude != null && images.length > 0;
    if (step === 3) return !!startTime && !!endTime;
    if (step === 4) return jim.some(j => j.selected);
    return false;
  }, [step, hostName, lockerName, address, latitude, longitude, images, startTime, endTime, jim]);

  const next = () => setStep(s => Math.min(4, s + 1));
  const prev = () => setStep(s => Math.max(1, s - 1));

  const submit = useCallback(async () => {
    if (!keeperId) {
      alert('로그인이 필요합니다. (keeperId 누락)');
      return { ok: false };
    }
    if (!jim.some(j => j.selected)) {
      alert('최소 하나 이상의 짐 타입을 선택해주세요.');
      return { ok: false };
    }

    setSubmitting(true);
    try {
      const locker = {
        lockerName,
        isAvailable: 'YES',
        keeperId: Number(keeperId),
        address,
        addressEnglish,
        addressDetail,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        jimTypeIds: jim.filter(j => j.selected).map(j => j.id),
      };

      await registerLocker({ locker, images });
      return { ok: true };
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || '등록 중 오류가 발생했습니다.');
      return { ok: false };
    } finally {
      setSubmitting(false);
    }
  }, [keeperId, lockerName, address, addressEnglish, addressDetail, latitude, longitude, jim, images]);

  return {
    step, next, prev, canNext, submit, submitting,
    hostName, setHostName,
    lockerName, setLockerName,
    address, setAddress, addressEnglish, setAddressEnglish, addressDetail, setAddressDetail,
    latitude, setLat, longitude, setLng,
    images, setImages,
    startTime, setStartTime, endTime, setEndTime,
    jim, setJim,
  };
}
