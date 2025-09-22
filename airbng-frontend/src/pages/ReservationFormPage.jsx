import React from "react";
import { useState, useEffect, useRef } from "react";
import {
  getReservationForm,
  postReservation,
  getWalletBalance,
} from "../api/reservationApi";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/pages/reservationForm.css";
import Header from "../components/Header/Header";
import tossIcon from "../../src/assets/toss_icon.png";
import airbngIcon from "../../src/assets/favicon.svg";
import { useAuth } from "../context/AuthContext";
import { getOrCreateIdemKey, clearIdemKey } from "../utils/idempotency";
import { Modal, useModal } from "../components/common/ModalUtil";

function useQueryParam(name) {
  const { search } = useLocation();
  return React.useMemo(
    () => new URLSearchParams(search).get(name),
    [search, name]
  );
}

function ReservationFormPage() {
  // 스크롤 최상단
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const lockerId = useQueryParam("lockerId");
  const navigate = useNavigate();

  // State 관리
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: -1,
    endDate: -1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState(-1);
  const [currentJimTypes, setCurrentJimTypes] = useState([]);
  const [jimTypeCounts, setJimTypeCounts] = useState({});
  const [dateArray, setDateArray] = useState([]);
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [lockerData, setLockerData] = useState({
    keeperId: 0,
    lockerName: "",
    addressKr: "",
  });
  const [dropdownStates, setDropdownStates] = useState({
    startTime: false,
    endTime: false,
  });
  const [startTimeOptions, setStartTimeOptions] = useState([]);
  const [endTimeOptions, setEndTimeOptions] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  const paymentMethods = [
    { id: "jimpay", name: "짐페이머니", icon: airbngIcon, method: "WALLET" },
    { id: "toss", name: "토스페이", icon: tossIcon, method: "PG" },
  ];

  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState(null);

  // 기존 useEffect들 사이에 새로운 useEffect 추가
  useEffect(() => {
    // 페이지 진입 시 바로 잔액 조회
    const initializeWalletBalance = async () => {
      if (!user) return;

      try {
        const data = await getWalletBalance();
        if (data.code === 1000) {
          setWalletBalance(data.result.balance);
        }
      } catch (error) {
        console.error("초기 잔액 조회 실패:", error);
      }
    };

    initializeWalletBalance();
  }, [user]); // user가 변경될 때만 실행
  const {
    modalState,
    showSuccess,
    showError,
    showWarning,
    showLoading,
    hideModal,
  } = useModal();
  const memberId = user?.id;

  const lastScopeRef = useRef(null);
  const attemptedRef = useRef(false);

  // 포인트 잔액 조회 함수
  const fetchWalletBalance = async () => {
    if (!user) return;

    try {
      const data = await getWalletBalance();
      if (data.code === 1000) {
        setWalletBalance(data.result.balance);
      } else {
        console.error("포인트 잔액 조회 실패:", data.message);
      }
    } catch (error) {
      console.error("포인트 잔액 조회 실패:", error);
    }
  };

  // 충전 페이지로 이동
  const navigateToCharge = () => {
    // 현재 상태 저장
    const reservationState = {
      selectedDateRange,
      selectedStartTime,
      selectedEndTime,
      jimTypeCounts,
      selectedPaymentMethod: selectedPaymentMethod?.id,
      lockerId,
    };
    sessionStorage.setItem(
      "reservationState",
      JSON.stringify(reservationState)
    );
    navigate("/page/mypage/wallet/charge");
  };

  // useEffect 추가 (기존 useEffect들과 함께)
  useEffect(() => {
    // 저장된 상태 복원
    const savedState = sessionStorage.getItem("reservationState");
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      setSelectedDateRange(parsedState.selectedDateRange);
      setSelectedStartTime(parsedState.selectedStartTime);
      setSelectedEndTime(parsedState.selectedEndTime);
      setJimTypeCounts(parsedState.jimTypeCounts);
      if (parsedState.selectedPaymentMethod) {
        const method = paymentMethods.find(
          (m) => m.id === parsedState.selectedPaymentMethod
        );
        setSelectedPaymentMethod(method || null);
      }
      // 상태 복원 후 삭제
      sessionStorage.removeItem("reservationState");
    }
  }, []);

  // 사용자가 결과에 영향을 주는 값들을 수정 -> 직전 스코프 키 폐기
  useEffect(() => {
    if (!attemptedRef.current) return;
    if (!lastScopeRef.current) return;
    clearIdemKey(lastScopeRef.current);
    attemptedRef.current = false;
    lastScopeRef.current = null;
  }, [
    selectedDateRange.startDate,
    selectedDateRange.endDate,
    selectedStartTime,
    selectedEndTime,
    jimTypeCounts,
    lockerId,
    selectedPaymentMethod?.method,
  ]);

  // 스코프 생성
  const buildScope = (method, lockerId) => `reservation:${method}:${lockerId}`;

  // 날짜 포맷팅 함수
  const formatDateTimeForServer = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // 시간 포맷팅 함수
  const formatHours = (hours) => {
    if (hours === 1) return "1시간";
    if (hours < 1) return `${Math.round(hours * 60)}분`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadLockerData();
    generateDateButtons();
  }, []);

  // 날짜나 시간 변경시 계산 업데이트
  useEffect(() => {
    updateTimeOptions();
    calculateTotal();
  }, [selectedDateRange, selectedStartTime, selectedEndTime, jimTypeCounts]);

  // 보관소 데이터 로드
  const loadLockerData = () => {
    getReservationForm(lockerId)
      .then((data) => {
        if (data.code === 1000) {
          const result = data.result;
          setLockerData({
            keeperId: result.keeperId,
            lockerName: result.lockerName,
            addressKr: result.addressKr,
          });
          console.log("result: ", result);
          setCurrentJimTypes(result.lockerJimTypes);
        } else if (data.code === 3005) {
          console.log("보관소가 비활성화 되었습니다." + data);
        } else {
          console.log("보관소 정보를 불러올 수 없습니다", data);
        }
      })
      .catch((error) => {
        console.error("API 요청 실패:", error);
      });
  };

  // 날짜 버튼 생성
  const generateDateButtons = () => {
    const today = new Date();
    const dates = [];

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const formatted = formatDateTimeForServer(targetDate);
      dates.push(formatted);
    }

    setDateArray(dates);
  };

  // 드래그 시작
  const startDrag = (e, index) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartIndex(index);
    setSelectedDateRange({ startDate: index, endDate: index });
  };

  // 드래그 업데이트
  const updateDrag = (index) => {
    if (!isDragging) return;

    const startIdx = Math.min(dragStartIndex, index);
    const endIdx = Math.max(dragStartIndex, index);

    setSelectedDateRange({ startDate: startIdx, endDate: endIdx });
  };

  // 드래그 종료
  const endDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragStartIndex(-1);
  };

  // 시간 옵션 업데이트
  const updateTimeOptions = () => {
    updateStartTimeOptions();
    updateEndTimeOptions();
  };

  // 시작 시간 옵션 업데이트
  const updateStartTimeOptions = () => {
    const options = [];
    const isToday = selectedDateRange.startDate === 0;
    let startH = 0;
    let startM = 0;

    if (isToday) {
      const now = new Date();
      const hour = now.getHours();
      const min = now.getMinutes();

      if (min <= 30) {
        startH = hour;
        startM = 30;
      } else {
        startH = hour + 1;
        startM = 0;
      }

      if (startH >= 24) {
        startH = 0;
        startM = 0;
      }
    }

    let currentHour = startH;
    let currentMin = startM;

    while (true) {
      const timeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin
        .toString()
        .padStart(2, "0")}`;
      options.push(timeStr);

      currentMin += 30;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }

      if (isToday && currentHour >= 24) break;
      if (!isToday && currentHour >= 24) currentHour = 0;
      if (!isToday && currentHour === startH && currentMin === startM) break;
    }

    setStartTimeOptions(options);

    if (options.length > 0 && !options.includes(selectedStartTime)) {
      setSelectedStartTime(options[0]);
    }
  };

  // 종료 시간 옵션 업데이트
  const updateEndTimeOptions = () => {
    if (!selectedStartTime) {
      setEndTimeOptions([]);
      return;
    }

    const options = [];
    const [startH, startM] = selectedStartTime.split(":").map(Number);
    const isSameDate =
      selectedDateRange.startDate === selectedDateRange.endDate;

    let currentHour = 0;
    let currentMin = 0;

    if (isSameDate) {
      currentHour = startH;
      currentMin = startM + 30;
    }

    while (true) {
      if (currentHour >= 24 && currentMin > 0) break;

      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }

      const timeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin
        .toString()
        .padStart(2, "0")}`;
      options.push(timeStr);

      if (timeStr === "24:00") break;

      currentMin += 30;
    }

    setEndTimeOptions(options);

    if (options.length > 0 && !options.includes(selectedEndTime)) {
      setSelectedEndTime(options[0]);
    }
  };

  // 드롭다운 토글
  const toggleDropdown = (type) => {
    setDropdownStates((prev) => ({
      ...prev,
      [type]: !prev[type],
      [type === "startTime" ? "endTime" : "startTime"]: false,
    }));
  };

  // 시간 선택
  const selectTimeOption = (type, value) => {
    if (type === "startTime") {
      setSelectedStartTime(value);
    } else {
      setSelectedEndTime(value);
    }
    setDropdownStates((prev) => ({ ...prev, [type]: false }));
  };

  // 수량 변경
  const changeQuantity = (jimTypeId, change) => {
    setJimTypeCounts((prev) => {
      const newValue = Math.max(0, (prev[jimTypeId] || 0) + change);
      return { ...prev, [jimTypeId]: newValue };
    });
  };

  // 총 가격 계산
  const calculateTotal = () => {
    if (
      (!selectedDateRange.startDate && selectedDateRange.startDate !== 0) ||
      !selectedStartTime ||
      !selectedEndTime
    ) {
      return { totalItemPrice: 0, serviceFee: 0, totalPrice: 0, items: [] };
    }

    const startDate = dateArray[selectedDateRange.startDate];
    const endDate = dateArray[selectedDateRange.endDate];

    const startDateTime = new Date(startDate + "T" + selectedStartTime);
    const endDateTime = new Date(endDate + "T" + selectedEndTime);

    const diffMs = endDateTime - startDateTime;
    const totalHours = diffMs / (1000 * 60 * 60);

    let totalItemPrice = 0;
    const items = [];

    currentJimTypes.forEach((jimType) => {
      const count = jimTypeCounts[jimType.jimTypeId] || 0;
      if (count > 0) {
        const itemPrice = jimType.pricePerHour * count * totalHours;
        totalItemPrice += itemPrice;
        items.push({
          name: jimType.typeName,
          count,
          hours: totalHours,
          price: itemPrice,
        });
      }
    });

    const serviceFee = Math.floor(totalItemPrice * 0.05);
    const totalPrice = Math.floor(totalItemPrice + serviceFee);

    return { totalItemPrice, serviceFee, totalPrice, items };
  };

  // 결제 수단 선택
  const selectPaymentMethod = (methodId) => {
    const found = paymentMethods.find((pm) => pm.id === methodId) || null;
    setSelectedPaymentMethod(found);

    // 짐페이머니 선택 시 포인트 조회
    if (methodId === "jimpay") {
      fetchWalletBalance();
    }
  };

  // 계산 결과
  const calculation = calculateTotal();

  // 하이라이팅 관련 함수들
  const clearHighlight = () => {
    const dateTitle = document.querySelector("#dateSection h3");
    if (dateTitle) {
      dateTitle.classList.remove("title-highlight");
    }

    const jimTitle = document.querySelector("#jimSection h3");
    const jimItems = document.querySelectorAll("#jimTypes > div");

    if (jimTitle) {
      jimTitle.classList.remove("title-highlight");
    }

    jimItems.forEach((item) => {
      item.classList.remove("jim-item-highlight");
    });

    const paymentTitle = document.querySelector("#paymentSection h3");
    const paymentItems = document.querySelectorAll(
      "#paymentMethods .payment-method"
    );

    if (paymentTitle) {
      paymentTitle.classList.remove("title-highlight");
    }

    paymentItems.forEach((item) => {
      item.classList.remove("payment-item-highlight");
    });
  };

  const highlightSection = (sectionType) => {
    clearHighlight();

    if (sectionType === "date") {
      const dateTitle = document.querySelector("#dateSection h3");

      if (dateTitle) {
        dateTitle.classList.add("title-highlight");
        dateTitle.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else if (sectionType === "jim") {
      const jimTitle = document.querySelector("#jimSection h3");
      const jimItems = document.querySelectorAll("#jimTypes > div");

      if (jimTitle) {
        jimTitle.classList.add("title-highlight");
      }

      jimItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add("jim-item-highlight");
        }, index * 150);
      });

      const jimSection = document.querySelector(".jim-types");
      if (jimSection) {
        jimSection.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else if (sectionType === "payment") {
      const paymentTitle = document.querySelector("#paymentSection h3");
      const paymentItems = document.querySelectorAll(
        "#paymentMethods .payment-method"
      );

      if (paymentTitle) {
        paymentTitle.classList.add("title-highlight");
      }

      paymentItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add("payment-item-highlight");
        }, index * 150);
      });

      const paymentSection = document.querySelector("#paymentSection");
      if (paymentSection) {
        paymentSection.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    setTimeout(() => {
      clearHighlight();
    }, 3000);
  };

  // 유효성 검사 함수
  const validateForm = () => {
    if (selectedDateRange.startDate < 0 || selectedDateRange.endDate < 0) {
      highlightSection("date");
      return false;
    }

    const hasSelectedItems = Object.values(jimTypeCounts).some(
      (count) => count > 0
    );

    if (!hasSelectedItems) {
      highlightSection("jim");
      return false;
    }

    if (!selectedPaymentMethod) {
      highlightSection("payment");
      return false;
    }

    return true;
  };

  // 성공 시 키 & 플래그 초기화
  const done = (scope) => {
    clearIdemKey(scope);
    attemptedRef.current = false;
    lastScopeRef.current = null;
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    await showLoading("결제 처리 중입니다...", "잠시만 기다려주세요", 500);

    const startDateStr = dateArray[selectedDateRange.startDate];
    const endDateStr = dateArray[selectedDateRange.endDate];

    const requestData = {
      lockerId: parseInt(lockerId),
      startTime: `${startDateStr} ${selectedStartTime}:00`,
      endTime: `${endDateStr} ${selectedEndTime}:00`,
      jimTypeCounts: Object.entries(jimTypeCounts)
        .filter(([_, count]) => count > 0)
        .map(([jimTypeId, count]) => ({
          jimTypeId: parseInt(jimTypeId),
          count: parseInt(count),
        })),
      amount: calculation.totalPrice - calculation.serviceFee,
      fee: calculation.serviceFee,
      paymentMethod: selectedPaymentMethod.method,
    };

    const idemScope = buildScope(
      requestData.paymentMethod,
      requestData.lockerId
    );
    lastScopeRef.current = idemScope;
    attemptedRef.current = true;

    postReservation(requestData, getOrCreateIdemKey(idemScope))
      .then((data) => {
        if (data.code === 4000) {
          showSuccess("예약이 완료되었습니다!", "", () => {
            done(idemScope);
            const reservationId = data.result?.reservationId || 0;
            if (reservationId === 0) {
              navigate("/page/home");
            } else {
              sessionStorage.setItem("lockerId", lockerId);
              navigate(
                "/page/reservations/detail/" +
                  reservationId +
                  "?from=reservation"
              );
            }
          });
        } else if (data.code === 3005) {
          showWarning("이용 불가", "보관소가 비활성화 되었습니다.", () => {
            done(idemScope);
            navigate(-1);
          });
        } else if (data.code === 9002) {
          showError(
            "예약 실패",
            "세션이 존재하지 않습니다.\n다시 로그인해주세요.",
            () => {
              done(idemScope);
              navigate("/page/login");
            }
          );
        } else {
          showError("예약 실패", data.message, () => {
            console.log(data);
          });
        }
      })
      .catch((error) => {
        console.error("API 요청 실패:", error);
        showError("예약 실패", "네트워크 오류. 잠시 후 다시 시도해주세요.");
      });
  };

  // 날짜 렌더링
  const renderDateButtons = () => {
    const today = new Date();
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    return (
      <div id="dateSection">
        <div className="date-header">
          <h3 className="date-title">
            {year}년 {month}월
          </h3>
        </div>
        <div className="date-container">
          <div className="day-labels">
            {Array.from({ length: 7 }, (_, i) => {
              const targetDate = new Date(today);
              targetDate.setDate(today.getDate() + i);
              return (
                <div key={i} className="day-label">
                  {days[targetDate.getDay()]}
                </div>
              );
            })}
          </div>
          <div className="date-buttons">
            {Array.from({ length: 7 }, (_, i) => {
              const targetDate = new Date(today);
              targetDate.setDate(today.getDate() + i);
              const dayNum = targetDate.getDate();

              let className = "date-btn ";

              if (
                i === selectedDateRange.startDate ||
                i === selectedDateRange.endDate
              ) {
                className += "selected ";
              } else if (
                i > selectedDateRange.startDate &&
                i < selectedDateRange.endDate
              ) {
                className += "in-range ";
              } else {
                className += "default ";
              }

              return (
                <button
                  key={i}
                  type="button"
                  className={className}
                  onMouseDown={(e) => startDrag(e, i)}
                  onMouseEnter={() => updateDrag(i)}
                  onMouseUp={endDrag}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="reservation-container">
      <Header headerTitle="예약하기" showBackButton showHomeButton />

      <div className="content">
        {/* 보관소 정보 */}
        <div id="lockerInfo">
          <div className="locker-info-content">
            <svg
              className="locker-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              ></path>
            </svg>
            <div className="locker-details">
              <h2 className="locker-name">{lockerData.lockerName}</h2>
              <p className="locker-address">{lockerData.addressKr}</p>
            </div>
          </div>
        </div>

        {/* 보관 날짜 */}
        {renderDateButtons()}

        {/* 보관 시간 */}
        <div id="timeSection">
          <h3 className="section-title">보관 시간</h3>
          <div className="time-selectors">
            <div className="time-selector">
              <label className="time-label">시작 시간</label>
              <div className="dropdown-wrapper">
                <div
                  className={`dropdown-selected ${
                    dropdownStates.startTime ? "active" : ""
                  }`}
                  onClick={() => toggleDropdown("startTime")}
                >
                  <span>{selectedStartTime || "시간 선택"}</span>
                  <svg
                    className={`dropdown-arrow ${
                      dropdownStates.startTime ? "rotate" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 12 8"
                  >
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                {dropdownStates.startTime && (
                  <div className="dropdown-options">
                    {startTimeOptions.map((time) => (
                      <div
                        key={time}
                        className={`dropdown-option ${
                          selectedStartTime === time ? "selected" : ""
                        }`}
                        onClick={() => selectTimeOption("startTime", time)}
                      >
                        {selectedStartTime === time && (
                          <span className="check-mark">✓</span>
                        )}
                        {time}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="time-selector">
              <label className="time-label">종료 시간</label>
              <div className="dropdown-wrapper">
                <div
                  className={`dropdown-selected ${
                    dropdownStates.endTime ? "active" : ""
                  }`}
                  onClick={() => toggleDropdown("endTime")}
                >
                  <span>{selectedEndTime || "시간 선택"}</span>
                  <svg
                    className={`dropdown-arrow ${
                      dropdownStates.endTime ? "rotate" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 12 8"
                  >
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                {dropdownStates.endTime && (
                  <div className="dropdown-options">
                    {endTimeOptions.map((time) => (
                      <div
                        key={time}
                        className={`dropdown-option ${
                          selectedEndTime === time ? "selected" : ""
                        }`}
                        onClick={() => selectTimeOption("endTime", time)}
                      >
                        {selectedEndTime === time && (
                          <span className="check-mark">✓</span>
                        )}
                        {time}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 짐 종류 */}
        <div id="jimSection" className="jim-section">
          <h3 className="section-title">짐 종류</h3>
          <div className="jim-types" id="jimTypes">
            {currentJimTypes.map((jimType) => {
              const count = jimTypeCounts[jimType.jimTypeId] || 0;
              const isSelected = count > 0;

              return (
                <div
                  key={jimType.jimTypeId}
                  className={`jim-type-item ${isSelected ? "selected" : ""}`}
                >
                  <div className="jim-type-content">
                    <div className="jim-type-info">
                      <div className="jim-type-name">{jimType.typeName}</div>
                      <div className="jim-type-price">
                        시간당 {jimType.pricePerHour.toLocaleString()}원
                      </div>
                    </div>
                    <div className="quantity-controls">
                      <button
                        type="button"
                        className={`quantity-btn ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => changeQuantity(jimType.jimTypeId, -1)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className={`quantity-input ${
                          isSelected ? "selected" : ""
                        }`}
                        value={count}
                        readOnly
                      />
                      <button
                        type="button"
                        className={`quantity-btn ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => changeQuantity(jimType.jimTypeId, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 결제 수단 */}
        <div id="paymentSection" className="payment-section">
          <h3 className="section-title">결제 수단</h3>
          <div id="paymentMethods" className="payment-methods">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`payment-method ${
                  selectedPaymentMethod?.id === method.id ? "selected" : ""
                }`}
                onClick={() => selectPaymentMethod(method.id)}
              >
                <div className="payment-method-content">
                  <div className="payment-method-radio">
                    <div
                      className={`radio-circle ${
                        selectedPaymentMethod?.id === method.id
                          ? "selected"
                          : ""
                      }`}
                    >
                      {selectedPaymentMethod?.id === method.id && (
                        <div className="radio-inner"></div>
                      )}
                    </div>
                  </div>
                  <img
                    className="payment-method-icon"
                    src={method.icon}
                    alt={method.name}
                  />
                  <div className="payment-method-info">
                    <div className="payment-method-name">{method.name}</div>
                  </div>
                  {method.id === "jimpay" &&
                    selectedPaymentMethod?.id === method.id && (
                      <div className="payment-method-actions">
                        <span className="balance-simple">
                          {walletBalance === null
                            ? ""
                            : `${Math.floor(walletBalance).toLocaleString()}원`}
                        </span>
                        <button
                          className="charge-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToCharge();
                          }}
                        >
                          ›
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 가격 계산 */}
        <div className="price-calculation">
          {calculation.items.map((item, index) => (
            <div key={index} className="price-item">
              <span>
                {item.name} × {item.count}개 × {formatHours(item.hours)}
              </span>
              <span>{item.price.toLocaleString()}원</span>
            </div>
          ))}
          <div className="price-item">
            <span>서비스 수수료 (5%)</span>
            <span>{calculation.serviceFee.toLocaleString()}원</span>
          </div>
          <hr className="price-divider" />
          <div className="price-total">
            <span>총 결제 금액</span>
            <span>{calculation.totalPrice.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="bottom-button">
        <button
          type="submit"
          form="reservationForm"
          className={`submit-button ${
            calculation.totalPrice === 0 ? "reserve-only" : ""
          }`}
          onClick={handleSubmit}
        >
          {calculation.totalPrice > 0
            ? `${calculation.totalPrice.toLocaleString()}원 결제하기`
            : "빠진 정보 확인하기"}
        </button>
      </div>

      {/* ModalUtil Modal */}
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
}

export default ReservationFormPage;
