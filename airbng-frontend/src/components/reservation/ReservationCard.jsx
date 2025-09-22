import React from "react";
import { useNavigate } from "react-router-dom";
import {
  formatDate,
  formatDateTime,
  formatDuration,
} from "../../utils/reservation/dateUtils";
import {
  getStatusText,
  goToReservationDetail,
  reBooking,
  getJimTypesText,
} from "../../utils/reservation/reservationUtils";
import logoImg from "../../assets/favicon.svg";
import { cancelReservationApi } from "../../api/reservationApi";
import { useModal, Modal } from "../common/ModalUtil";

const ReservationCard = ({
  reservation,
  currentIsDropper,
  memberId,
  activeMoreMenu,
  toggleMoreMenu,
  onShowConfirmModal,
  onShowSuccess,
  onShowError,
  onShowConfirm,
}) => {
  const navigate = useNavigate();
  const modal = useModal();
  const jimTypes = getJimTypesText(reservation.jimTypeResults);

  // 예약 취소 처리 함수
  const handleCancelReservation = async (reservationId) => {
    try {
      const response = await cancelReservationApi(reservationId);
      const data = response.data;

      if (data.code === 1000) {
        modal.showSuccess(
          "예약 취소 완료",
          "예약이 성공적으로 취소되었습니다.",
          () => {
            window.location.reload();
          }
        );
      } else {
        modal.showError("예약 취소 실패", data.message, () => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error("예약 취소 실패:", error);
      modal.showError("예약 취소 실패", "네트워크 오류가 발생했습니다.", () => {
        window.location.reload();
      });
    }
  };

  // 예약 취소 확인 모달 표시
  const showCancelConfirm = (reservationId) => {
    modal.showConfirm(
      "예약 취소",
      "정말로 예약을 취소하시겠습니까?",
      () => handleCancelReservation(reservationId),
      () => {}
    );
  };

  const renderActionButtons = () => {
    if (reservation.state === "PENDING" && currentIsDropper === true) {
      return (
        <div className="actions-buttons">
          <button
            className="btn btn-cancel"
            onClick={() => showCancelConfirm(reservation.reservationId)}
          >
            취소 요청
          </button>
        </div>
      );
    }

    if (reservation.state === "COMPLETED" && currentIsDropper === true) {
      return (
        <div className="completed-actions">
          <button
            className="btn rebook-btn"
            onClick={() => {
              if (!reservation.lockerId) {
                modal.showError("예약 불가", "보관소 정보가 없어 다시 예약할 수 없습니다.");
                return;
              }
              reBooking(navigate, reservation.lockerId);
            }}
          >
            다시 예약
          </button>
          <div
            className="more-btn"
            onClick={() => toggleMoreMenu(reservation.reservationId)}
          >
            <svg
              className="more-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
            {activeMoreMenu === reservation.reservationId && (
              <div className="more-menu show">
                <div
                  className="more-menu-item"
                  onClick={() => onShowConfirmModal(reservation.reservationId)}
                >
                  삭제
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (reservation.state === "CONFIRMED" && currentIsDropper === true) {
      return (
        <div className="actions-buttons">
          <button
            className="btn btn-cancel"
            onClick={() => showCancelConfirm(reservation.reservationId)}
          >
            취소 요청
          </button>
        </div>
      );
    }
    return null;
  };

  const renderReservationItem = () => (
    <div className="reservation-item">
      {reservation.lockerImage ? (
        <img
          src={reservation.lockerImage}
          alt="보관소"
          className="item-image"
        />
      ) : (
        <img src={logoImg} alt="기본 로고" className="item-image" />
      )}
      <div className="item-info">
        <div className="item-title">
          {reservation.lockerName || "보관소 정보 없음"}
        </div>
        <div className="item-types">
          {formatDuration(reservation.durationHours)} • {jimTypes}
        </div>
      </div>
    </div>
  );

  // 메인 카드 렌더링 로직
  let cardContent;

  if (reservation.state === "COMPLETED") {
    const hasActions = currentIsDropper;
    cardContent = (
      <div
        className={`reservation-card completed ${
          hasActions ? "has-actions" : "no-actions"
        }`}
      >
        <div className="reservation-header">
          <div className="reservation-info-row">
            <button
              className="view-details"
              onClick={() =>
                goToReservationDetail(
                  navigate,
                  reservation.reservationId,
                  memberId
                )
              }
            >
              예약 상세 &gt;
            </button>
            {getStatusText(reservation.state)}
          </div>
        </div>

        {/* 보관소 이미지 + 정보 */}
        {renderReservationItem()}

        {/* 버튼 영역 (있으면 렌더링) */}
        {hasActions && (
          <div className="completed-actions">
            <button
              className="btn rebook-btn"
              onClick={() => {
                if (!reservation.lockerId) {
                  modal.showError("예약 불가", "보관소 정보가 없어 다시 예약할 수 없습니다.");
                  return;
                }
                reBooking(navigate, reservation.lockerId);
              }}
            >
              다시 예약
            </button>
            <div
              className="more-btn"
              onClick={() => toggleMoreMenu(reservation.reservationId)}
            >
              <svg
                className="more-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
              {activeMoreMenu === reservation.reservationId && (
                <div className="more-menu show">
                  <div
                    className="more-menu-item"
                    onClick={() =>
                      onShowConfirmModal(reservation.reservationId)
                    }
                  >
                    삭제
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  } else if (reservation.state === "CANCELLED") {
    cardContent = (
      <div className={`reservation-card cancelled cancelled-state`}>
        <div className="reservation-inner">
          <div className="reservation-header">
            <div className="reservation-info-row">
              <div
                className="more-btn always-visible"
                onClick={() => toggleMoreMenu(reservation.reservationId)}
              >
                <svg
                  className="more-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
                {activeMoreMenu === reservation.reservationId && (
                  <div className="more-menu show">
                    <div
                      className="more-menu-item"
                      onClick={() =>
                        onShowConfirmModal(reservation.reservationId)
                      }
                    >
                      삭제
                    </div>
                  </div>
                )}
              </div>
              {getStatusText(reservation.state)}
            </div>
          </div>
          <div className="reservation-body">{renderReservationItem()}</div>
        </div>
      </div>
    );
  } else {
    // 기본 카드 (예약완료, 예약대기)
    cardContent = (
      <div className="reservation-card">
        <div className="reservation-header">
          <div className="reservation-date">
            {formatDate(reservation.dateOnly)}
          </div>
          <div className="reservation-info-row">
            <button
              className="view-details"
              onClick={() =>
                goToReservationDetail(
                  navigate,
                  reservation.reservationId,
                  memberId
                )
              }
            >
              예약 상세 &gt;
            </button>
            {getStatusText(reservation.state)}
          </div>
        </div>
        {renderReservationItem()}
        <div className="item-date-row">
          <div className="item-date-col">
            <div className="label">시작 날짜</div>
            <div className="value">{formatDateTime(reservation.startTime)}</div>
          </div>
          <div className="item-date-col">
            <div className="label">찾는 날짜</div>
            <div className="value">{formatDateTime(reservation.endTime)}</div>
          </div>
        </div>
        {renderActionButtons()}
      </div>
    );
  }

  return (
    <>
      {cardContent}
      <Modal {...modal.modalState} onClose={modal.hideModal} />
    </>
  );
};

export default ReservationCard;
