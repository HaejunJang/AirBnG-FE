import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getReservationList,
  deleteReservationApi,
  cancelReservationApi,
  confirmReservationApi,
  completeReservationApi
} from "../api/reservationApi";
import { useAuth } from "../context/AuthContext";
import { Modal, useModal } from "../components/common/ModalUtil";
import {
  goToReservationDetail,
  reBooking,
  getJimTypesText,
} from "../utils/reservation/reservationUtils";
import {
  formatDateTime,
  formatDuration,
} from "../utils/reservation/dateUtils";
import styles from "../styles/pages/ReservationListNew.module.css";
import Header from "../components/Header/Header";

const PERIOD_OPTIONS = [
  { value: "ALL", label: "전체" },
  { value: "1W", label: "1주" },
  { value: "1M", label: "1개월" },
  { value: "3M", label: "3개월" },
  { value: "6M", label: "6개월" },
  { value: "1Y", label: "1년" },
];

const Clock = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12,6 12,12 16,14"></polyline>
  </svg>
);

const CheckCircle = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m9 12 2 2 4-4"></path>
    <circle cx="12" cy="12" r="10"></circle>
  </svg>
);

const XCircle = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="m15 9-6 6"></path>
    <path d="m9 9 6 6"></path>
  </svg>
);

const AlertCircle = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const ReservationListNew = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const memberId = user?.id;

  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('reservationList_activeTab') || "upcoming";
  });
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('reservationList_userRole') || "customer";
  });
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextCursorId, setNextCursorId] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [activeMoreMenu, setActiveMoreMenu] = useState(null);
  const [backendMessage, setBackendMessage] = useState("");

  const [period, setPeriod] = useState("ALL");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen((v) => !v);
  const closeDropdown = () => setDropdownOpen(false);
  const selectPeriod = (value) => {
    setPeriod(value);
    closeDropdown();
  };

  const filterByPeriod = (reservations) => {
    if (period === "ALL") return reservations;
    const now = new Date();
    const periodStart = new Date();
    switch (period) {
      case "1W":
        periodStart.setDate(now.getDate() - 7);
        break;
      case "1M":
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case "6M":
        periodStart.setMonth(now.getMonth() - 6);
        break;
      case "1Y":
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
      default:
        periodStart.setFullYear(1970);
    }
    return reservations.filter((reservation) => {
      const resDate = new Date(reservation.startTime || reservation.dateOnly);
      return resDate >= periodStart && resDate <= now;
    });
  };

  const showPeriodFilter = ["current", "completed", "cancelled"].includes(activeTab);

  const { modalState, showConfirm, showSuccess, showError, hideModal } =
    useModal();

  // 상태 매핑
  const getStatesForTab = (tabId) => {
    switch (tabId) {
      case "upcoming":
        return ["PENDING", "CONFIRMED"];
      case "current":
        return ["CONFIRMED"]; // 현재 이용중만 필터링은 별도 로직으로
      case "finishing":
        return [
          "CONFIRMED",
          "COMPLETING_DROPPER_ONLY",
          "COMPLETING_KEEPER_ONLY",
        ];
      case "completed":
        return ["COMPLETED"];
      case "cancelled":
        return ["CANCELLED", "REJECTED"];
      default:
        return [];
    }
  };

  // 예약 데이터 가져오기
  const fetchReservations = useCallback(
    async (isFirst = false) => {
      if (!memberId || loading) return;

      setLoading(true);
      try {
        const states = getStatesForTab(activeTab);
        const params = {
          isDropper: userRole === "customer",
          memberId,
          state: states,
        };

        if (nextCursorId && !isFirst) {
          params.nextCursorId = nextCursorId;
        }

        const response = await getReservationList(params);

        let newReservations = [];
        let backendMsg = "";

        if (response.data.code === 4015) {
          // 백엔드가 "예약 내역 없음"이라고 보냈을 때
          newReservations = [];
          backendMsg = response.data.message || "예약 내역이 없습니다.";
          setHasNextPage(false);
          setNextCursorId(null);
        } else {
          const result = response.data?.result || {};
          newReservations = result.reservations || [];
          setNextCursorId(result.nextCursorId ?? null);
          setHasNextPage(result.hasNextPage ?? false);
        }

        setReservations(newReservations);
        setBackendMessage(backendMsg);
      } catch (error) {
        console.error("예약 조회 오류:", error);
        if (isFirst) {
          setBackendMessage("예약 내역을 불러오는데 실패했습니다.");
        }
      } finally {
        setLoading(false);
      }
    },
    [memberId, activeTab, userRole, nextCursorId, loading]
  );

  const redirectParam = encodeURIComponent(location.pathname);

  const showLoading = () => setLoading(true);

  const goToLogin = () => {
    showLoading();
    setTimeout(() => {
      navigate(`/page/login?redirect=${redirectParam}`, { replace: true });
    }, 300);
  };

  const goToSignup = () => {
    showLoading();
    setTimeout(() => {
      navigate(`/page/signup?redirect=${redirectParam}`, { replace: true });
    }, 300);
  };

  // 탭 변경
  const handleTabChange = (tabId) => {
    if (loading) return;
    setActiveTab(tabId);
    sessionStorage.setItem('reservationList_activeTab', tabId);
    setReservations([]);
    setNextCursorId(null);
    setHasNextPage(true);
    setBackendMessage("");
    // 스크롤 맨 위로
    document.querySelector(`.${styles.contentNew}`)?.scrollTo(0, 0);
  };

  // 역할 변경
  const handleRoleChange = (role) => {
    if (loading) return;
    setUserRole(role);
    sessionStorage.setItem('reservationList_userRole', role);
    setReservations([]);
    setNextCursorId(null);
    setHasNextPage(true);
    setBackendMessage("");
  };

  // 더보기 메뉴 토글
  const toggleMoreMenu = (reservationId) => {
    setActiveMoreMenu(activeMoreMenu === reservationId ? null : reservationId);
  };

  // 예약 삭제
  const handleDeleteReservation = async (reservationId) => {
    try {
      const result = await deleteReservationApi(reservationId);
      if (result.data?.code === 1000) {
        showSuccess("삭제 완료", "예약이 삭제되었습니다.");
        // 목록 새로고침
        setReservations([]);
        setNextCursorId(null);
        setHasNextPage(true);
        await fetchReservations(true);
      } else {
        showError("삭제 실패", "예약 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("예약 삭제 오류:", error);
      showError("삭제 실패", "예약 삭제 중 오류가 발생했습니다.");
    }
  };

  // 예약 취소
  const handleCancelReservation = async (reservationId) => {
    try {
      const response = await cancelReservationApi(reservationId);
      const data = response.data;

      if (data.code === 1000) {
        const result = data.result;
        const totalAmount = result ? result.amount + result.fee : 0;
        const refundAmount = totalAmount - (result ? result.chargeFee : 0);
        const refundMessage = result.chargeFee !== 0 
          ? `💰 환불 정보

          결제 금액: ${totalAmount.toLocaleString()}원
          취소 수수료: ${result.chargeFee.toLocaleString()}원
          환불 금액: ${refundAmount.toLocaleString()}원
(*1일내 환불 처리)`
          : `전액 환불 처리됩니다.
(*1일내 환불 처리)`;
      
        showSuccess("취소 완료", refundMessage);
        
        // 목록 새로고침
        setReservations([]);
        setNextCursorId(null);
        setHasNextPage(true);
        await fetchReservations(true);
      } else {
        showError("예약 취소 실패", data.message);
      }
    } catch (error) {
      console.error("예약 취소 실패:", error);
      showError("예약 취소 실패", "네트워크 오류. 잠시 후 다시 시도해주세요.");
    }
  };

  // 삭제 확인 모달
  const showDeleteConfirm = (reservationId) => {
    showConfirm(
      "예약 삭제",
      "정말로 예약을 삭제하시겠습니까?",
      () => handleDeleteReservation(reservationId),
      null
    );
    setActiveMoreMenu(null);
  };

  // 수수료 안내와 함께 취소 확인
  const showCancelConfirm = (reservationId, reservationState) => {
    if (reservationState === "CONFIRMED") {
      // CONFIRMED 상태에서는 수수료 안내 포함
      const cancelMessage = `⚠️ 취소 수수료 안내

예약 확정 후 취소 시 수수료가 발생할 수 있어요!
• 당일 취소: 20%
• 하루 전 취소: 10%  
• 그 외: 수수료 없음

(*정확한 수수료는 취소 처리 후 안내됩니다)`;

      showConfirm(
        "예약 취소",
        cancelMessage,
        () => handleCancelReservation(reservationId),
        () => {}
      );
    } else {
      // 다른 상태에서는 바로 취소
      showConfirm(
        "예약 취소",
        "정말로 예약을 취소하시겠습니까?",
        () => handleCancelReservation(reservationId),
        () => {}
      );
    }
  };

  // 완료 확인 처리
  const handleCompleteConfirm = async (reservationId) => {
    try{
      const response = await completeReservationApi(reservationId);
      const data = response.data;

      if (data.code === 1000) {
        showSuccess("완료 확인", "예약이 완료 처리되었습니다.");
        // 목록 새로고침
        setReservations([]);
        setNextCursorId(null);
        setHasNextPage(true);
        await fetchReservations(true);
      } else {
        showError("완료 실패", data.message);
      }
    } catch (error) {
      console.error("예약 완료 실패:", error);
      showError("완료 실패", "네트워크 오류. 잠시 후 다시 시도해주세요.");
    }

  };

  // 승인/거절 처리 (호스트용)
  const handleApprove = async (reservationId) => {
    try {
      const response = await confirmReservationApi(reservationId, true);
      const data = response.data;

      if (data.code === 1000) {
        showSuccess("승인되었습니다!", "");
        // 목록 새로고침
        setReservations([]);
        setNextCursorId(null);
        setHasNextPage(true);
        await fetchReservations(true);
      } else {
        showError("승인 실패", data.message);
      }
    } catch (error) {
      console.error("예약 승인 실패:", error);
      showError("승인 실패", "네트워크 오류. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleReject = (reservationId) => {
    showConfirm("예약 거절", "정말로 이 예약을 거절하시겠습니까?", async () => {
      try {
        const response = await confirmReservationApi(reservationId, false);
        const data = response.data;

        if (data.code === 1000) {
          showSuccess("거절되었습니다!", "");
          // 목록 새로고침
          setReservations([]);
          setNextCursorId(null);
          setHasNextPage(true);
          await fetchReservations(true);
        } else {
          showError("거절 실패", data.message);
        }
      } catch (error) {
        console.error("예약 거절 실패:", error);
        showError("거절 실패", "네트워크 오류. 잠시 후 다시 시도해주세요.");
      }
    });
  };

  // 상태별 아이콘과 색상 반환
  const getStatusInfo = (status, userRole, reservation) => {
    switch (status) {
      case "PENDING":
        return {
          text: userRole === "customer" ? "승인대기중" : "승인요청",
          color: `${styles.textOrange600} ${styles.bgOrange50}`,
          icon: <Clock className={styles.w4} />,
        };
      case "CONFIRMED":
        if (reservation) {
          const now = new Date();
          const startTime = new Date(reservation.startTime);
          const endTime = new Date(reservation.endTime);
          
          // 현재 이용중인 경우
          if (now >= startTime && now <= endTime) {
            return {
              text: userRole === "customer" ? "이용중" : "보관중",
              color: `${styles.textGreen600} ${styles.bgGreen50}`,
              icon: <CheckCircle className={styles.w4} />,
            };
          }
          
          // finishing 탭에서 endTime이 지난 CONFIRMED는 "완료 대기중"으로 표시
          if (activeTab === "finishing" && now > endTime) {
            return {
              text: "완료 확인 필요",
              color: `${styles.textPurple600} ${styles.bgPurple50}`,
              icon: <AlertCircle className={styles.w4} />,
            };
          }
        }
        return {
          text: userRole === "customer" ? "예약확정" : "승인완료",
          color: `${styles.textBlue600} ${styles.bgBlue50}`,
          icon: <CheckCircle className={styles.w4} />,
        };

      case "COMPLETING_DROPPER_ONLY":
        return {
          text: userRole === "customer" ? "완료 대기중" : "완료 확인 필요",
          color: userRole === "customer" ? `${styles.textYellow600} ${styles.bgYellow50}` : `${styles.textPurple600} ${styles.bgPurple50}`,
          icon: <AlertCircle className={styles.w4} />,
        };
        
      case "COMPLETING_KEEPER_ONLY":
        return {
          text: userRole === "customer" ? "완료 확인 필요" : "완료 대기중",
          color: userRole === "customer" ? `${styles.textPurple600} ${styles.bgPurple50}` : `${styles.textYellow600} ${styles.bgYellow50}`,
          icon: <AlertCircle className={styles.w4} />,
        };
      case "COMPLETED":
        return {
          text: "완료",
          color: `${styles.textGreen600} ${styles.bgGreen50}`,
          icon: <CheckCircle className={styles.w4} />,
        };
      case "CANCELLED":
        return {
          text: userRole === "customer" ? "취소함" : "취소됨",
          color: `${styles.textRed600} ${styles.bgRed50}`,
          icon: <XCircle className={styles.w4} />,
        };
      case "REJECTED":
        return {
          text: userRole === "customer" ? "거절됨" : "거절함",
          color: `${styles.textRed600} ${styles.bgRed50}`,
          icon: <XCircle className={styles.w4} />,
        };
      default:
        return {
          text: "알 수 없음",
          color: `${styles.textGray600} ${styles.bgGray50}`,
          icon: <AlertCircle className={styles.w4} />,
        };
    }
  };

  // 현재 이용중인지 확인
  const isCurrentlyInUse = (reservation) => {
    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);
    return (
      reservation.state === "CONFIRMED" && now >= startTime && now <= endTime
    );
  };

  // 예약 카드 컴포넌트
  const ReservationCard = ({ reservation }) => {
    const statusInfo = getStatusInfo(reservation.state, userRole, reservation);
    const jimTypes = getJimTypesText(reservation.jimTypeResults);
    const isCurrentUse = isCurrentlyInUse(reservation);

    const showDeleteMenu = activeTab === "cancelled" &&
      (reservation.state === "CANCELLED" || reservation.state === "REJECTED");

    return (
      <div className={styles.reservationCardNew}>
        <div className={styles.cardHeader}>
          <div className={`${styles.statusBadge} ${statusInfo.color}`}>
            {statusInfo.icon}
            <span>{statusInfo.text}</span>
          </div>

          {/* 오른쪽 영역 */}
          <div className={styles.headerRightSection}>
            {/* 예약 상세 버튼 */}
            <button
              className={styles.detailBtn}
              onClick={() =>
                goToReservationDetail(
                  navigate,
                  reservation.reservationId,
                  memberId,
                  { activeTab, userRole }
                )
              }
            >
              예약 상세
            </button>

            {/* 오른쪽 상단 ... 버튼 (취소/거절 탭에서만) */}
            {showDeleteMenu && (
              <div className={styles.moreMenuContainer}>
                <button
                  className={styles.moreBtn}
                  onClick={e => {
                    e.stopPropagation();
                    toggleMoreMenu(reservation.reservationId);
                  }}
                  aria-label="삭제 메뉴"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="19" cy="12" r="1"></circle>
                    <circle cx="5" cy="12" r="1"></circle>
                  </svg>
                </button>
                {activeMoreMenu === reservation.reservationId && (
                  <div 
                    className={styles.moreMenu}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className={styles.moreMenuItem}
                      onClick={() => showDeleteConfirm(reservation.reservationId)}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* 예약 정보 */}
        <div className={styles.cardContent}>
          <div className={styles.placeInfo}>
            <div className={styles.placeImage}>
              {reservation.lockerImage ? (
                <img src={reservation.lockerImage} alt="보관소" />
              ) : (
                <div className={styles.placeImagePlaceholder}></div>
              )}
            </div>
            <div className={styles.placeDetails}>
              <h3 className={styles.placeName}>
                {reservation.lockerName || reservation.placeName}
              </h3>
              <p className={styles.placeMeta}>
                {formatDuration(reservation.durationHours)} • {jimTypes}
              </p>
            </div>
          </div>

          {/* 시간 정보 */}
          <div className={styles.timeInfo}>
            <div className={styles.timeCol}>
              <div className={styles.timeLabel}>시작 날짜</div>
              <div className={styles.timeValue}>
                {formatDateTime(reservation.startTime)}
              </div>
            </div>
            <div className={styles.timeCol}>
              <div className={styles.timeLabel}>종료 날짜</div>
              <div className={styles.timeValue}>
                {formatDateTime(reservation.endTime)}
              </div>
            </div>
          </div>
        </div>

        {/* 현재 이용중 표시 */}
        {isCurrentUse && activeTab === "current" && (
          <div className={styles.currentUseIndicator}>
            <CheckCircle className={styles.w4} />
            <span>
              {userRole === "customer"
                ? "현재 이용중인 예약입니다"
                : "현재 보관중인 예약입니다"}
            </span>
          </div>
        )}

        {/* 완료대기 탭 추가 정보 (완료 확인을 이미 한 경우만) */}
        {activeTab === "finishing" && (
          <div className={styles.finishingInfo}>
            {reservation.state === "COMPLETING_DROPPER_ONLY" && userRole === "customer" && (
              <div className={`${styles.infoBox} ${styles.purple}`}>
                <p className={styles.infoTitle}>
                  상대방의 완료 확인을 기다리고 있습니다
                </p>
              </div>
            )}
            {reservation.state === "COMPLETING_KEEPER_ONLY" && userRole === "host" && (
              <div className={`${styles.infoBox} ${styles.purple}`}>
                <p className={styles.infoTitle}>
                  상대방의 완료 확인을 기다리고 있습니다
                </p>
              </div>
            )}
          </div>
        )}

        {/* 완료대기 탭 완료 확인 버튼 */}
        {activeTab === "finishing" && (
          <>
            {reservation.state === "CONFIRMED" && (
              <div className={`${styles.cardActions} ${styles.single}`}>
                <button
                  className={`${styles.completeBtn} ${styles.fullWidth}`}
                  onClick={() => handleCompleteConfirm(reservation.reservationId)}
                >
                  완료 확인
                </button>
              </div>
            )}
            {reservation.state === "COMPLETING_DROPPER_ONLY" && userRole === "host" && (
              <div className={`${styles.cardActions} ${styles.single}`}>
                <button
                  className={`${styles.completeBtn} ${styles.fullWidth}`}
                  onClick={() => handleCompleteConfirm(reservation.reservationId)}
                >
                  완료 확인
                </button>
              </div>
            )}
            {reservation.state === "COMPLETING_KEEPER_ONLY" && userRole === "customer" && (
              <div className={`${styles.cardActions} ${styles.single}`}>
                <button
                  className={`${styles.completeBtn} ${styles.fullWidth}`}
                  onClick={() => handleCompleteConfirm(reservation.reservationId)}
                >
                  완료 확인
                </button>
              </div>
            )}
          </>
        )}

        {/* 액션 버튼들 */}
        {reservation.state === "PENDING" && userRole === "customer" && (
          <div className={`${styles.cardActions} ${styles.single}`}>
            <button
              className={`${styles.cancelBtn} ${styles.fullWidth}`}
              onClick={() => showCancelConfirm(reservation.reservationId, reservation.state)}
            >
              예약 취소
            </button>
          </div>
        )}

        {reservation.state === "PENDING" && userRole === "host" && (
          <div className={`${styles.cardActions} ${styles.double}`}>
            <button
              className={styles.rejectBtn}
              onClick={() => handleReject(reservation.reservationId)}
            >
              거절
            </button>
            <button
              className={styles.approveBtn}
              onClick={() => handleApprove(reservation.reservationId)}
            >
              승인
            </button>
          </div>
        )}

        {reservation.state === "CONFIRMED" &&
          activeTab === "upcoming" &&
          userRole === "customer" && (
            <div className={`${styles.cardActions} ${styles.double}`}>
              <button
                className={styles.cancelBtn}
                onClick={() => showCancelConfirm(reservation.reservationId, reservation.state)}
              >
                예약 취소
              </button>
            </div>
          )}

        {/* 완료된 예약의 다시 예약 버튼 */}
        {reservation.state === "COMPLETED" && userRole === "customer" && (
          <div className={`${styles.cardActions} ${styles.single}`}>
            <button
              className={`${styles.rebookBtn} ${styles.fullWidth}`}
              onClick={() => reBooking(navigate, reservation.lockerId)}
            >
              다시 예약
            </button>
          </div>
        )}

      </div>
    );
  };

  // 탭 정보
  const tabs = [
    { id: "upcoming", label: "예정된 예약" },
    { id: "current", label: "진행중" },
    { id: "finishing", label: "완료대기" },
    { id: "completed", label: "완료" },
    { id: "cancelled", label: "취소/거절" },
  ];

  // 현재 탭의 예약 가져오기
  const getCurrentReservations = () => {
    const states = getStatesForTab(activeTab);
    let filtered = reservations.filter((reservation) =>
      states.includes(reservation.state)
    );

    // upcoming 탭에서는 CONFIRMED 상태 중 startTime이 현재 시간 이후인 것들만 표시
    if (activeTab === "upcoming") {
      const now = new Date();
      filtered = filtered.filter((reservation) => {
        if (reservation.state === "CONFIRMED") {
          const startTime = new Date(reservation.startTime);
          return now < startTime;
        }
        return true; // PENDING은 그대로 표시
      });
    }

    // current 탭에서는 현재 이용중인 것만 표시
    if (activeTab === "current") {
      filtered = filtered.filter((reservation) => {
        return isCurrentlyInUse(reservation);
      });
    }

    // finishing 탭에서는 CONFIRMED 상태 중 endTime이 지난 것들과 기존 완료대기 상태들을 표시
    if (activeTab === "finishing") {
      const now = new Date();
      filtered = filtered.filter((reservation) => {
        if (reservation.state === "CONFIRMED") {
          const endTime = new Date(reservation.endTime);
          return now > endTime;
        }
        return [
          "COMPLETING_DROPPER_ONLY",
          "COMPLETING_KEEPER_ONLY",
        ].includes(reservation.state);
      });
    }

    return filtered;
  };

  // URL 파라미터에서 상태 복원 (컴포넌트 마운트 시에만)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const returnTab = urlParams.get('returnTab');
    const returnRole = urlParams.get('returnRole');
    
    if (returnTab) {
      setActiveTab(returnTab);
      sessionStorage.setItem('reservationList_activeTab', returnTab);
    }
    if (returnRole) {
      setUserRole(returnRole);
      sessionStorage.setItem('reservationList_userRole', returnRole);
    }
  }, [location.search]);

  // 초기 로딩
  useEffect(() => {
    if (memberId) {
      fetchReservations(true);
      document.querySelector(`.${styles.contentNew}`)?.scrollTo(0, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userRole, memberId]);

  // 외부 클릭시 더보기 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => setActiveMoreMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (!memberId) {
    return (
      <div className={styles.container}>

        <Header 
          headerTitle="예약 내역"
          showBackButton={true}
          onBack={() => navigate(-1)}
        />
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeTitle}>환영합니다!</h1>
            <p className={styles.welcomeSubtitle}>
              예약 내역을 확인하려면{"\n"}로그인 또는 회원가입이 필요합니다.
            </p>
            <div className={styles.welcomeButtons}>
              <button className={styles.btnPrimary} onClick={goToLogin}>
                로그인
              </button>
              <button className={styles.btnSecondary} onClick={goToSignup}>
                회원가입
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentReservations = filterByPeriod(getCurrentReservations());

  return (
    <div className={styles.reservationListNew}>
      {/* 헤더 */}
      <Header 
        headerTitle="예약 내역"
        showBackButton={true}
        onBack={() => navigate(-1)}
      />

      {/* 역할 선택 */}
      <div className={styles.roleSelector}>
        <div className={styles.roleSelectorContent}>
          <div className={styles.roleToggle}>
            <button
              onClick={() => handleRoleChange("customer")}
              className={`${styles.roleOption} ${
                userRole === "customer" ? styles.active : ""
              }`}
            >
              이용 내역
            </button>
            <button
              onClick={() => handleRoleChange("host")}
              className={`${styles.roleOption} ${
                userRole === "host" ? styles.active : ""
              }`}
            >
              제공 내역
            </button>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className={styles.tabsNew}>
        <div className={styles.tabsContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`${styles.tabNew} ${activeTab === tab.id ? styles.active : ""}`}
            >
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className={styles.contentNew}>
        {/* 기간 필터 드롭다운 */}
        {showPeriodFilter && (
          <div className={styles.periodDropdown}>
            <button
              className={`${styles.dropdownBtn} ${dropdownOpen ? styles.open : ""}`}
              onClick={toggleDropdown}
              type="button"
            >
              <span>
                {PERIOD_OPTIONS.find((p) => p.value === period)?.label || "전체"}
              </span>
              <svg className={styles.dropdownArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                {PERIOD_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={styles.dropdownItem}
                    onClick={() => selectPeriod(option.value)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {loading && currentReservations.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.loadingSpinner}></div>
            <p>로딩 중...</p>
          </div>
        ) : currentReservations.length > 0 ? (
          currentReservations.map((reservation) => (
            <ReservationCard
              key={reservation.reservationId}
              reservation={reservation}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <p>{backendMessage || "해당하는 예약이 없습니다"}</p>
          </div>
        )}
      </div>

      {/* 모달 */}
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

export default ReservationListNew;
