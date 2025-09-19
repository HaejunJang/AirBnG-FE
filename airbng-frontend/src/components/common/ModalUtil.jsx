import React, { useEffect, useCallback } from "react";
import "../../styles/common/modalUtil.css";

/**
 * 통합 모달 컴포넌트
 * @param {Object} props - 모달 props
 * @param {boolean} props.show - 모달 표시 여부
 * @param {string} props.type - 모달 타입 (success, error, warning, info, confirm, loading)
 * @param {string} props.title - 모달 제목
 * @param {string} props.message - 모달 메시지
 * @param {string} props.confirmText - 확인 버튼 텍스트
 * @param {string} props.cancelText - 취소 버튼 텍스트
 * @param {boolean} props.showCancel - 취소 버튼 표시 여부
 * @param {Function} props.onConfirm - 확인 콜백
 * @param {Function} props.onCancel - 취소 콜백
 * @param {Function} props.onClose - 모달 닫기 콜백
 */
const Modal = ({
  show = false,
  type = "info",
  title = "",
  message = "",
  confirmText = "확인",
  cancelText = "취소",
  showCancel = false,
  onConfirm = null,
  onCancel = null,
  onClose = null,
}) => {
  // ESC 키 처리
  const handleEscKey = useCallback(
    (event) => {
      if (event.key === "Escape" && show) {
        if (onClose) {
          onClose();
        } else if (onCancel) {
          onCancel();
        }
      }
    },
    [show, onClose, onCancel]
  );

  useEffect(() => {
    if (show) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [show, handleEscKey]);

  // 아이콘 클래스 반환
  const getIconClass = (modalType) => {
    const iconClasses = {
      success: "success-rotate",
      error: "error-shake",
      warning: "warning-pulse",
      info: "info",
      confirm: "confirm-bounce",
      loading: "",
    };
    return iconClasses[modalType] || "info";
  };

  // 아이콘 심볼 반환
  const getIconSymbol = (modalType) => {
    const iconSymbols = {
      success: "✓",
      error: "!",
      warning: "!",
      info: "i",
      confirm: "?",
      loading: "",
    };
    return iconSymbols[modalType] || "i";
  };

  // 확인 버튼 클릭 처리
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    if (onClose) {
      onClose();
    }
  };

  // 취소 버튼 클릭 처리
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (onClose) {
      onClose();
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal-util-overlay">
      <div className="modal-util">
        <div className="modal-util-content">
          {type === "loading" ? (
            <>
              <div className="modal-util-loading-spinner"></div>
              {title && <div className="modal-util-title">{title}</div>}
              {message && <div className="modal-util-message">{message}</div>}
            </>
          ) : (
            <>
              <div className={`modal-util-icon ${getIconClass(type)}`}>
                {getIconSymbol(type)}
              </div>
              {title && <div className="modal-util-title">{title}</div>}
              {message && (
                <div
                  className="modal-util-message"
                  dangerouslySetInnerHTML={{
                    __html: message.replace(/\n/g, "<br>"),
                  }}
                />
              )}
            </>
          )}
        </div>

        {type !== "loading" && (
          <div
            className={`modal-util-buttons ${showCancel ? "two-buttons" : ""}`}
          >
            {showCancel && (
              <>
                <button className="modal-util-btn" onClick={handleCancel}>
                  {cancelText}
                </button>
                <div className="modal-util-divider"></div>
              </>
            )}
            <button className="modal-util-btn" onClick={handleConfirm}>
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 모달 훅 - 모달 상태 관리
 */
const useModal = () => {
  const [modalState, setModalState] = React.useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "확인",
    cancelText: "취소",
    showCancel: false,
    onConfirm: null,
    onCancel: null,
  });

  // modalState 변경 모니터링 제거
  // React.useEffect(() => {
  //   console.log("useModal - modalState 변경됨:", modalState);
  // }, [modalState]);

  // 모달 표시
  const showModal = useCallback((config) => {
    setModalState({
      show: true,
      type: config.type || "info",
      title: config.title || "",
      message: config.message || "",
      confirmText: config.confirmText || "확인",
      cancelText: config.cancelText || "취소",
      showCancel: config.showCancel || false,
      onConfirm: config.onConfirm || null,
      onCancel: config.onCancel || null,
    });
  }, []);

  // 모달 숨기기
  const hideModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, show: false }));
  }, []);

  // 편의 메서드들
  const showSuccess = useCallback(
    (
      message = "작업이 성공적으로 완료되었습니다.",
      title = "성공",
      callback = null
    ) => {
      showModal({
        type: "success",
        title,
        message,
        onConfirm: callback,
        showCancel: false,
      });
    },
    [showModal]
  );

  const showError = useCallback(
    (
      message = "처리 중 오류가 발생했습니다.",
      title = "오류",
      callback = null
    ) => {
      showModal({
        type: "error",
        title,
        message,
        onConfirm: callback,
        showCancel: false,
      });
    },
    [showModal]
  );

  const showWarning = useCallback(
    (message = "주의가 필요합니다.", title = "경고", callback = null) => {
      showModal({
        type: "warning",
        title,
        message,
        onConfirm: callback,
        showCancel: false,
      });
    },
    [showModal]
  );

  const showInfo = useCallback(
    (
      message = "안내 메시지가 표시됩니다.",
      title = "알림",
      callback = null
    ) => {
      showModal({
        type: "info",
        title,
        message,
        onConfirm: callback,
        showCancel: false,
      });
    },
    [showModal]
  );

  const showConfirm = useCallback(
    (
      title = "확인",
      message = "정말로 진행하시겠습니까?",
      onConfirm = null,
      onCancel = null
    ) => {
      showModal({
        type: "confirm",
        title,
        message,
        onConfirm,
        onCancel,
        showCancel: true,
      });
    },
    [showModal]
  );

  const showLoading = useCallback(
    (message = "처리 중...", title = "잠시만 기다려주세요") => {
      showModal({
        type: "loading",
        title,
        message,
        showCancel: false,
      });
    },
    [showModal]
  );

  return {
    modalState,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showLoading,
  };
};

/**
 * 모달 유틸리티 클래스 (기존 ModalUtils와 호환성을 위해)
 */
class ModalUtils {
  static modalRef = null;

  static setModalRef(ref) {
    this.modalRef = ref;
  }

  static showSuccess(message, title, callback) {
    if (this.modalRef) {
      this.modalRef.showSuccess(message, title, callback);
    }
  }

  static showError(message, title, callback) {
    if (this.modalRef) {
      this.modalRef.showError(message, title, callback);
    }
  }

  static showWarning(message, title, callback) {
    if (this.modalRef) {
      this.modalRef.showWarning(message, title, callback);
    }
  }

  static showInfo(message, title, callback) {
    if (this.modalRef) {
      this.modalRef.showInfo(message, title, callback);
    }
  }

  static showConfirm(title, message, onConfirm, onCancel) {
    if (this.modalRef) {
      this.modalRef.showConfirm(title, message, onConfirm, onCancel);
    }
  }

  static showLoading(message, title) {
    if (this.modalRef) {
      this.modalRef.showLoading(message, title);
    }
  }

  static hideModal() {
    if (this.modalRef) {
      this.modalRef.hideModal();
    }
  }
}

export { Modal, useModal, ModalUtils };
export default Modal;
