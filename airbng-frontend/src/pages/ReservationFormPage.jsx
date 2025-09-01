import React from "react";
import { useState, useEffect } from "react";
import { getReservationForm, postReservation } from "../api/reservationApi";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/pages/reservationForm.css";
import Header from "../components/Header/Header";

function useQueryParam(name) {
  const { search } = useLocation();
  return React.useMemo(
    () => new URLSearchParams(search).get(name),
    [search, name]
  );
}

function ReservationFormPage() {
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
    lockerName: "",
    addressKr: "",
  });
  const [dropdownStates, setDropdownStates] = useState({
    startTime: false,
    endTime: false,
  });
  const [modal, setModal] = useState({
    show: false,
    type: "",
    title: "",
    message: "",
    callback: null,
  });
  const [startTimeOptions, setStartTimeOptions] = useState([]);
  const [endTimeOptions, setEndTimeOptions] = useState([]);

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

  // Modal 유틸리티
  const ModalUtils = {
    showSuccess: (message, title = "", callback = null) => {
      setModal({ show: true, type: "success", title, message, callback });
    },
    showError: (message, title = "", callback = null) => {
      setModal({ show: true, type: "error", title, message, callback });
    },
    showWarning: (message, title = "", callback = null) => {
      setModal({ show: true, type: "warning", title, message, callback });
    },
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
            lockerName: result.lockerName,
            addressKr: result.addressKr,
          });
          console.log("result: ", result);
          setCurrentJimTypes(result.lockerJimTypes);
          // generateJimTypes(result.lockerJimTypes);
        } else if (data.code === 3005) {
          // ModalUtils.showWarning(
          //   "보관소가 비활성화 되었습니다.",
          //   "이용 불가",
          //   () => {
          //     window.history.back();
          //   }
          // );
          console.log("보관소가 비활성화 되었습니다." + data);
        } else {
          // ModalUtils.showError(
          //   "보관소 정보를 불러올 수 없습니다.",
          //   "정보 없음",
          //   () => {
          //     window.history.back();
          //   }
          // );
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

  // 짐 타입 생성
  const generateJimTypes = (jimTypes) => {
    const counts = {};
    jimTypes.forEach((jimType) => {
      counts[jimType.jimTypeId] = 0;
    });
    setJimTypeCounts(counts);
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

    // 기존 선택된 시간이 새 옵션에 없다면 첫 번째로 설정
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

    // 기존 선택된 시간이 새 옵션에 없다면 첫 번째로 설정
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

  // 계산 결과
  const calculation = calculateTotal();

  // 하이라이팅 관련 함수들
  const clearHighlight = () => {
    // 날짜 섹션 타이틀 하이라이팅 제거
    const dateTitle = document.querySelector("#dateSection h3");
    if (dateTitle) {
      dateTitle.classList.remove("title-highlight");
    }

    // jim 섹션 타이틀/아이템 하이라이팅 제거
    const jimTitle = document.querySelector("#jimSection h3");
    const jimItems = document.querySelectorAll("#jimTypes > div");

    if (jimTitle) {
      jimTitle.classList.remove("title-highlight");
    }

    jimItems.forEach((item) => {
      item.classList.remove("jim-item-highlight");
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
      const jimTitle = document.querySelector("#jimSection h3"); // h3로 변경
      const jimItems = document.querySelectorAll("#jimTypes > div"); // 실제 짐 타입 박스들

      if (jimTitle) {
        jimTitle.classList.add("title-highlight");
      }

      // 각 짐 타입 박스에 하이라이팅 효과 (순차적으로)
      jimItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add("jim-item-highlight");
        }, index * 150); // 0.15초씩 차이나게 순차 적용
      });

      // 짐 섹션으로 스크롤
      const jimSection = document.querySelector(".jim-types");
      if (jimSection) {
        jimSection.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    // 3초 후 하이라이팅 제거
    setTimeout(() => {
      clearHighlight();
    }, 3000);
  };

  // 유효성 검사 함수
  const validateForm = () => {
    // 날짜 선택 확인
    if (selectedDateRange.startDate < 0 || selectedDateRange.endDate < 0) {
      //   ModalUtils.showWarning("보관 날짜를 선택해주세요.", "날짜 미선택");
      highlightSection("date");
      return false;
    }

    // 짐 종류 선택 확인
    const hasSelectedItems = Object.values(jimTypeCounts).some(
      (count) => count > 0
    );
    if (!hasSelectedItems) {
      //   ModalUtils.showWarning("보관할 짐을 선택해주세요.", "짐 종류 미선택");
      highlightSection("jim");
      return false;
    }

    return true;
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const startDateStr = dateArray[selectedDateRange.startDate];
    const endDateStr = dateArray[selectedDateRange.endDate];

    const requestData = {
      dropperId: 2,
      keeperId: 3,
      lockerId: parseInt(lockerId),
      startTime: `${startDateStr} ${selectedStartTime}:00`,
      endTime: `${endDateStr} ${selectedEndTime}:00`,
      jimTypeCounts: Object.entries(jimTypeCounts)
        .filter(([_, count]) => count > 0)
        .map(([jimTypeId, count]) => ({
          jimTypeId: parseInt(jimTypeId),
          count: parseInt(count),
        })),
    };

    console.log("Request Data:", requestData);

    postReservation(requestData)
      .then((data) => {
        if (data.code === 4000) {
          ModalUtils.showSuccess("예약이 완료되었습니다!", "", () => {
            const reservationId = data.result?.reservationId || 0;
            if (reservationId === 0) {
              navigate("/page/home");
            } else {
              sessionStorage.setItem("lockerId", lockerId);
              navigate("/page/reservation?reservationId=" + reservationId);
            }
          });
        } else if (data.code === 3005) {
          ModalUtils.showWarning(
            "보관소가 비활성화 되었습니다.",
            "이용 불가",
            () => {
              navigate(-1);
            }
          );
        } else if (data.code === 9002) {
          ModalUtils.showError(
            "세션이 존재하지 않습니다.\n다시 로그인해주세요.",
            "예약 실패",
            () => {
              navigate("/page/login");
            }
          );
        } else {
          ModalUtils.showError(data.message, "예약 실패", () => {
            navigate(-1);
          });
        }
      })
      .catch((error) => {
        console.error("API 요청 실패:", error);
        ModalUtils.showError(
          "예약 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.",
          "예약 실패"
        );
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
      {/* 헤더 */}
      <Header
        headerTitle="예약하기"
        showBackButton
        // backUrl={window.history.back()}
        showHomeButton
      />

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
            {/* 시작 시간 드롭다운 */}
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

            {/* 종료 시간 드롭다운 */}
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
          className="submit-button"
          onClick={handleSubmit}
        >
          예약하기
        </button>
      </div>

      {/* 모달 */}
      {modal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">{modal.title}</h3>
            <p className="modal-message">{modal.message}</p>
            <button
              className={`modal-button ${modal.type}`}
              onClick={() => {
                setModal({
                  show: false,
                  type: "",
                  title: "",
                  message: "",
                  callback: null,
                });
                if (modal.callback) modal.callback();
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationFormPage;
