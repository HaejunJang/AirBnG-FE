// hooks/useLockerManageForm.js
import { useCallback, useEffect, useState } from "react";
import { deleteLocker, getLockerForUpdate, toggleLockerActivation, updateLocker } from "../api/lockerApi";
import { useModal } from "../components/common/ModalUtil";

export default function useLockerManageForm(lockerId, { keeperId }) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [files, setFiles] = useState([]);        // 교체할 새 파일들
  const [replaceMode, setReplaceMode] = useState(false);
  const modal = useModal();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getLockerForUpdate(lockerId);
      const d = data?.result ?? data;
      setDetail(d);
      setFiles([]);
      setReplaceMode(false);
    } finally {
      setLoading(false);
    }
  }, [lockerId]);

  useEffect(() => { load(); }, [load]);

  const patchActivation = async () => { await toggleLockerActivation(lockerId); await load(); };

  const submit = async () => {
    if (!detail) return;

    // 최소 1개 짐 타입 선택 보장
    const selectedJimIds = (detail.jimTypeResults || [])
      .filter(j => j.enabled)
      .map(j => j.jimTypeId);
    if (selectedJimIds.length === 0) {
      modal.showError('선택 필요', '최소 하나 이상의 짐 타입을 선택해주세요.');
      return;
    }

    const locker = {
        lockerId: detail.lockerId,
        lockerName: detail.lockerName,
        address: detail.address,
        addressDetail: detail.addressDetail,
        addressEnglish: detail.addressEnglish,
        latitude: parseFloat(detail.latitude),
        longitude: parseFloat(detail.longitude),
        isAvailable: detail.isAvailable,
        keeperId: keeperId ? Number(keeperId) : undefined,
        jimTypeIds: selectedJimIds,
    };

    // 교체 모드일 때만 파일 전송 → 서버가 기존 이미지 전부 삭제 후 새 이미지로 교체
    await updateLocker({ lockerId, locker, images: replaceMode ? files : [] });
  };

  const remove = async () => {
    return new Promise((resolve) => {
      modal.showConfirm(
        '삭제 확인',
        '정말 삭제하시겠습니까? 삭제된 정보는 복구할 수 없습니다.',
        async () => {
          await deleteLocker(lockerId);
          resolve();
        }
      );
    });
  };

  return {
    loading,
    detail, setDetail,
    files, setFiles,
    replaceMode, setReplaceMode,
    submit, patchActivation, remove, reload: load
  };
}
