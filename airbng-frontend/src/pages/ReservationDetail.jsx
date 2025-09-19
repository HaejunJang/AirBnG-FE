import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../styles/pages/ReservationDetail.css";
import { getReservationDetail } from "../api/reservationApi";

import { useAuth } from "../context/AuthContext";

import RotateIcon from "../assets/3d-rotate.svg";
import BoxIcon from "../assets/box.svg";
import CalendarIcon from "../assets/calendar copy.svg";
import ClockIcon from "../assets/clock copy.svg";

const ReservationDetail = () => {
  const navigate = useNavigate();
  const { reservationId } = useParams();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const isFromReservation = urlParams.get("from") === "reservation"; // 예약 완료 직후인지 확인

  console.log("reservationId:", typeof reservationId);
  console.log("isFromReservation:", isFromReservation);

  const { user } = useAuth(); // AuthContext에서 사용자 정보 가져오기
  const memberId = user?.id; // memberId 파싱

  const [reservationData, setReservationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 스크롤 최상단으로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // API 호출 함수
  const fetchReservationDetail = async (reservationId, memberId) => {
    try {
      setLoading(true);
      const response = await getReservationDetail(reservationId, memberId);
      console.log("API 응답 성공:", response);
      console.log("응답 데이터:", response.result);

      setReservationData(response.result);
    } catch (err) {
      console.error("API 호출 에러 상세:", err);

      setError(
        err.response?.result?.message || "예약 상세 정보를 불러올 수 없습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 API 호출
  useEffect(() => {
    console.log("=== ReservationDetail 디버깅 ===");
    console.log("reservationId:", reservationId);
    console.log("memberId:", memberId);

    if (reservationId && memberId) {
      console.log("API 호출할 값들:");
      console.log("testReservationId:", reservationId);
      console.log("testMemberId:", memberId);

      fetchReservationDetail(reservationId, memberId);
    }
  }, [reservationId, memberId]);

  // 필수 매개변수가 없는 경우 처리
  if (!reservationId || !memberId) {
    return (
      <div className="reservation-detail">
        <div className="reservation-detail__header">
          <button
            className="reservation-detail__back-btn"
            onClick={() => navigate(-1)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 19L5 12L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="reservation-detail__title">예약 상세</h1>
        </div>
        <div className="reservation-detail__content">
          <div className="error-message">
            잘못된 접근입니다. 필요한 정보가 없습니다.
          </div>
        </div>
      </div>
    );
  }

  // 로딩 중이거나 에러가 있을 때 처리
  if (loading) {
    return (
      <div className="reservation-detail">
        <div className="reservation-detail__header">
          <button
            className="reservation-detail__back-btn"
            onClick={() => navigate(-1)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="reservation-detail__title">예약 상세</h1>
        </div>
        <div className="reservation-detail__content">
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            로딩 중...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reservation-detail">
        <div className="reservation-detail__header">
          <button
            className="reservation-detail__back-btn"
            onClick={() => navigate(-1)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="reservation-detail__title">예약 상세</h1>
        </div>
        <div className="reservation-detail__content">
          <div
            style={{ textAlign: "center", padding: "50px 0", color: "#ff4444" }}
          >
            {error}
          </div>
        </div>
      </div>
    );
  }

  const data = reservationData?.result || reservationData;

  console.log("=== 데이터 처리 단계 ===");
  console.log("reservationData:", reservationData);
  console.log("data:", data);

  // userRole 계산: keeperId와 현재 사용자 ID 비교
  const userRole = data?.keeperId === memberId ? "keeper" : "dropper";
  console.log("계산된 userRole:", userRole);

  if (!data) {
    return (
      <div className="reservation-detail">
        <div className="reservation-detail__header">
          <button
            className="reservation-detail__back-btn"
            onClick={() => navigate(-1)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="reservation-detail__title">예약 상세</h1>
        </div>
        <div className="reservation-detail__content">
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            데이터가 없습니다.
          </div>
        </div>
      </div>
    );
  }

  // Parse dates
  const startDate = new Date(data.startTime);
  const endDate = new Date(data.endTime);

  // Format dates
  const formatDate = (date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // 시간 포맷팅 함수 (FormPage와 동일)
  const formatHours = (hours) => {
    if (hours === 1) return "1시간";
    if (hours < 1) return `${Math.round(hours * 60)}분`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  };

  // Calculate total price (FormPage 로직과 동일하게 수정)
  const calculateTotal = () => {
    const diffMs = endDate - startDate;
    const totalHours = diffMs / (1000 * 60 * 60);
    let totalItemPrice = 0;
    const items = [];

    if (data.reservationJimTypes && data.reservationJimTypes.length > 0) {
      data.reservationJimTypes.forEach((item) => {
        const itemPrice = item.count * item.pricePerHour * totalHours;
        totalItemPrice += itemPrice;
        items.push({
          name: item.typeName,
          count: item.count,
          hours: totalHours,
          price: itemPrice,
        });
      });
    }

    const serviceFee = Math.floor(totalItemPrice * 0.05); // 5% 수수료
    const total = Math.floor(totalItemPrice + serviceFee);

    return {
      itemTotal: totalItemPrice,
      serviceFee: serviceFee,
      total: total,
      items: items,
    };
  };

  const pricing = calculateTotal();

  const handleCancel = async () => {
    try {
      const action = userRole === "keeper" ? "거절" : "취소";
      console.log(action + "하기");

      // API 호출 예시 (실제 엔드포인트에 맞게 수정 필요)
      // await http.put(`/AirBnG/reservations/${reservationId}/cancel`);
      // 또는
      // await http.put(`/AirBnG/reservations/${reservationId}/reject`);

      // 성공 후 이전 페이지로 이동하거나 상태 업데이트
      // navigate(-1);
    } catch (err) {
      console.error("취소/거절 에러:", err);
      alert(err.response?.data?.message || "처리 중 오류가 발생했습니다.");
    }
  };

  const handleConfirm = async () => {
    try {
      const action = userRole === "keeper" ? "승인" : "확인";
      console.log(action);

      // API 호출 예시 (실제 엔드포인트에 맞게 수정 필요)
      // await http.put(`/AirBnG/reservations/${reservationId}/confirm`);
      // 또는
      // await http.put(`/AirBnG/reservations/${reservationId}/approve`);

      // 성공 후 이전 페이지로 이동하거나 상태 업데이트
      // navigate(-1);
    } catch (err) {
      console.error("확인/승인 에러:", err);
      alert(err.response?.data?.message || "처리 중 오류가 발생했습니다.");
    }
  };

  const handleBackClick = () => {
    navigate(-1); // 이전 페이지로 돌아가기
  };

  return (
    <div className="reservation-detail">
      <div className="reservation-detail__header">
        <button
          className="reservation-detail__back-btn"
          onClick={handleBackClick}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="reservation-detail__title">예약 상세</h1>
      </div>

      <div className="reservation-detail__content">
        {/* 예약 완료 메시지 (예약 직후에만 표시) */}
        {isFromReservation && (
          <div className="reservation-success">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="#ffffff" stroke="#4561db" stroke-width="6"/>
                <path d="M30 50l12 12 25-25" stroke="#4561db" stroke-width="6" stroke-linecap="round"
                      stroke-linejoin="round" fill="none"/>
              </svg>
            </div>
            <h2 className="success-title">예약이 완료되었습니다!</h2>
          </div>
        )}

        <div className="locker-info">
          <img
              src={
                data.images && data.images.length > 0
                    ? data.images[0]
                    : "/api/placeholder/60/60"
              }
              alt="보관소 이미지"
            className="locker-info__image"
          />
          <div className="locker-info__details">
            <h2 className="locker-info__name">{data.lockerName || "보관소"}</h2>
            <p className="locker-info__address">서울 강남구 강남대로 396</p>
          </div>
        </div>

        <div className="reservation-section">
          <h3 className="section-title">보관 날짜</h3>
          <div className="section-content">
            <img
              src={CalendarIcon}
              alt="달력 아이콘"
              className="section-icon"
              width="20"
              height="20"
            />
            <span>
              {formatDate(startDate)} ~ {formatDate(endDate)}
            </span>
          </div>
        </div>

        <div className="reservation-section">
          <h3 className="section-title">보관 시간</h3>
          <div className="section-content">
            <img
              src={ClockIcon}
              alt="시계 아이콘"
              className="section-icon"
              width="20"
              height="20"
            />
            <span>
              {formatTime(startDate)} ~ {formatTime(endDate)}
            </span>
          </div>
        </div>

        <div className="reservation-section">
          <h3 className="section-title">짐 종류</h3>
          <div className="jim-types">
            {data.reservationJimTypes &&
              data.reservationJimTypes.map((item, index) => (
                <div key={index} className="jim-type-item">
                  <img
                    src={BoxIcon}
                    alt="박스 아이콘"
                    className="section-icon"
                    width="20"
                    height="20"
                  />
                  <span>
                    {item.typeName} {item.count}개
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="reservation-section">
          <h3 className="section-title">픽업 방식</h3>
          <div className="section-content">
            <img
              src={RotateIcon}
              alt="회전 아이콘"
              className="section-icon"
              width="20"
              height="20"
            />
            <span>직접 직 건네주기</span>
          </div>
        </div>

        <div className="price-calculation">
          {pricing.items.map((item, index) => (
            <div key={index} className="price-item">
              <span>
                {item.name} × {item.count}개 × {formatHours(item.hours)}
              </span>
              <span>{item.price.toLocaleString()}원</span>
            </div>
          ))}
          <div className="price-item">
            <span>서비스 수수료 (5%)</span>
            <span>{pricing.serviceFee.toLocaleString()}원</span>
          </div>
          <hr className="price-divider" />
          <div className="price-total">
            <span>총 결제 금액</span>
            <span>{pricing.total.toLocaleString()}원</span>
          </div>
        </div>

        <div className="notice">
          <p>* 30분안에 승인하지 않으면 자동거절됩니다.</p>
        </div>

        <div className="action-buttons">
          <button className="btn-cancel" onClick={handleCancel}>
            {userRole === "keeper" ? "거절" : "취소"}
          </button>
          <button className="btn-confirm" onClick={handleConfirm}>
            {userRole === "keeper" ? "승인" : "확인"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetail;
