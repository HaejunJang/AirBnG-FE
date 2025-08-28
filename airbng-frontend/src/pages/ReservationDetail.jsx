import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/ReservationDetail.css';

import RotateIcon from '../assets/3d-rotate.svg';
import BoxIcon from '../assets/box.svg';
import CalendarIcon from '../assets/calendar copy.svg';
import ClockIcon from '../assets/clock copy.svg';

const ReservationDetail = ({ reservationData }) => {
  const navigate = useNavigate();
  
  // Mock data for demonstration - replace with actual API data
  const mockData = {
    reservationId: 1,
    lockerName: "로드커피1",
    dropperNickname: "지은keeper",
    keeperNickname: "민호keeper",
    startTime: "2025-07-01T19:00",
    endTime: "2025-07-02T03:00",
    images: [
      "https://airbngbucket.s3.ap-northeast-2.amazonaws.com/profiles/1867f2df-b3dc-4ed3-82ca-f63875037c80_default.jpeg"
    ],
    state: "COMPLETED",
    reservationJimTypes: [
      {
        typeName: "캐리어 대형",
        count: 1,
        pricePerHour: 2000
      },
      {
        typeName: "캐리어 소형",
        count: 1,
        pricePerHour: 1500
      }
    ]
  };

  const data = reservationData?.result || mockData;

  // Parse dates
  const startDate = new Date(data.startTime);
  const endDate = new Date(data.endTime);
  
  // Format dates
  const formatDate = (date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Calculate total price
  const calculateTotal = () => {
    const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
    let total = 0;
    
    data.reservationJimTypes.forEach(item => {
      total += item.count * item.pricePerHour * hours;
    });
    
    const serviceTime = hours * 2; // 2시간씩 서비스 수수료
    const serviceFee = serviceTime * 200; // 시간당 200원
    
    return {
      itemTotal: total,
      serviceFee: serviceFee,
      total: total + serviceFee
    };
  };

  const pricing = calculateTotal();

  const handleCancel = () => {
    // Cancel logic
    console.log('취소하기');
  };

  const handleConfirm = () => {
    // Confirm logic
    console.log('확인');
  };

  const handleBackClick = () => {
    navigate('/page/reservations');
  };

  return (
    <div className="reservation-detail">
      <div className="reservation-detail__header">
        <button className="reservation-detail__back-btn" onClick={handleBackClick}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="reservation-detail__title">예약 상세</h1>
      </div>

      <div className="reservation-detail__content">
        <div className="locker-info">
          <img 
            src={data.images && data.images.length > 0 ? data.images[0] : "/api/placeholder/60/60"} 
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
            <img src={CalendarIcon} alt="달력 아이콘" className="section-icon" width="20" height="20" />
            <span>{formatDate(startDate)} ~ {formatDate(endDate)}</span>
          </div>
        </div>

        <div className="reservation-section">
          <h3 className="section-title">보관 시간</h3>
          <div className="section-content">
            <img src={ClockIcon} alt="시계 아이콘" className="section-icon" width="20" height="20" />
            <span>{formatTime(startDate)} ~ {formatTime(endDate)}</span>
          </div>
        </div>

        <div className="reservation-section">
          <h3 className="section-title">짐 종류</h3>
          <div className="jim-types">
            {data.reservationJimTypes.map((item, index) => (
              <div key={index} className="jim-type-item">
                <img src={BoxIcon} alt="박스 아이콘" className="section-icon" width="20" height="20" />
                <span>{item.typeName} {item.count}개</span>
              </div>
            ))}
          </div>
        </div>

        <div className="reservation-section">
          <h3 className="section-title">픽업 방식</h3>
          <div className="section-content">
            <img src={RotateIcon} alt="회전 아이콘" className="section-icon" width="20" height="20" />
            <span>직접 직 건네주기</span>
          </div>
        </div>

        <div className="pricing-section">
          {data.reservationJimTypes.map((item, index) => (
            <div key={index} className="pricing-item">
              <span className="pricing-label">{item.typeName} + 2시간</span>
              <span className="pricing-value">{(item.count * item.pricePerHour * 2).toLocaleString()}원</span>
            </div>
          ))}
          <div className="pricing-item">
            <span className="pricing-label">서비스 수수료</span>
            <span className="pricing-value">{pricing.serviceFee.toLocaleString()}원</span>
          </div>
          
          <div className="pricing-total">
            <span className="pricing-total-label">총 결제 금액</span>
            <span className="pricing-total-value">{pricing.total.toLocaleString()}원</span>
          </div>
        </div>

        <div className="notice">
          <p>* 30분안에 승인하지 않으면 자동거절됩니다.</p>
        </div>

        <div className="action-buttons">
          <button className="btn-cancel" onClick={handleCancel}>
            취소
          </button>
          <button className="btn-confirm" onClick={handleConfirm}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetail;