import React from "react";
import { Modal, useModal, ModalUtils } from "./ModalUtil";

/**
 * 모달 사용 예제 컴포넌트
 */
const ModalExample = () => {
  const {
    modalState,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showLoading,
  } = useModal();

  // ModalUtils 레퍼런스 설정 (기존 코드와의 호환성을 위해)
  React.useEffect(() => {
    ModalUtils.setModalRef({
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showConfirm,
      showLoading,
      hideModal,
    });
  }, [
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showLoading,
    hideModal,
  ]);

  const handleSuccessModal = () => {
    showSuccess("작업이 성공적으로 완료되었습니다!", "성공", () => {
      console.log("성공 모달 확인됨");
    });
  };

  const handleErrorModal = () => {
    showError("오류가 발생했습니다.\n다시 시도해주세요.", "오류", () => {
      console.log("에러 모달 확인됨");
    });
  };

  const handleWarningModal = () => {
    showWarning("이 작업은 되돌릴 수 없습니다.", "경고", () => {
      console.log("경고 모달 확인됨");
    });
  };

  const handleInfoModal = () => {
    showInfo("새로운 업데이트가 있습니다.", "알림", () => {
      console.log("정보 모달 확인됨");
    });
  };

  const handleConfirmModal = () => {
    showConfirm(
      "확인",
      "정말로 삭제하시겠습니까?",
      () => {
        console.log("삭제 확인됨");
        showSuccess("삭제가 완료되었습니다.");
      },
      () => {
        console.log("삭제 취소됨");
      }
    );
  };

  const handleLoadingModal = () => {
    showLoading("처리 중입니다...", "잠시만 기다려주세요");

    // 3초 후 성공 모달로 변경
    setTimeout(() => {
      showSuccess("처리가 완료되었습니다!");
    }, 3000);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>모달 사용 예제</h2>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={handleSuccessModal}>성공 모달</button>
        <button onClick={handleErrorModal}>에러 모달</button>
        <button onClick={handleWarningModal}>경고 모달</button>
        <button onClick={handleInfoModal}>정보 모달</button>
        <button onClick={handleConfirmModal}>확인 모달</button>
        <button onClick={handleLoadingModal}>로딩 모달</button>
      </div>

      {/* 모달 컴포넌트 */}
      <Modal
        show={modalState.show}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        onClose={hideModal}
      />
    </div>
  );
};

export default ModalExample;
