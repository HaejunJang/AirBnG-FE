import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/pages/ReservationDetail.css';
import { httpPublic } from "../api/http";

import RotateIcon from '../assets/3d-rotate.svg';
import BoxIcon from '../assets/box.svg';
import CalendarIcon from '../assets/calendar copy.svg';
import ClockIcon from '../assets/clock copy.svg';

const ReservationDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { reservationId, memberId, userRole } = location.state || {};
  
  const [reservationData, setReservationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API 호출 함수
  const fetchReservationDetail = async (testReservationId, testMemberId) => {
    try {
      setLoading(true);
      const apiUrl = `/AirBnG/reservations/${testReservationId}/members/${testMemberId}/detail`;
      console.log('API 호출 URL:', apiUrl);
      
      console.log('API 응답 성공:', response);
      console.log('응답 데이터:', response.data);
      
      const response = await httpPublic.get(apiUrl);
      setReservationData(response.data);
    } catch (err) {
      console.error('API 호출 에러 상세:', err);
      console.error('에러 응답:', err.response);
      console.error('에러 메시지:', err.response?.data);
      
      setError(err.response?.data?.message || '예약 상세 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 API 호출
  useEffect(() => {
    console.log('=== ReservationDetail 디버깅 ===');
    console.log('location.state:', location.state);
    console.log('reservationId:', reservationId);
    console.log('memberId:', memberId);
    console.log('userRole:', userRole);
    
    // 일단 예시 데이터로 테스트
    const testReservationId = reservationId || 1;
    const testMemberId = memberId || 1;
    
    console.log('API 호출할 값들:');
    console.log('testReservationId:', testReservationId);
    console.log('testMemberId:', testMemberId);
    
    fetchReservationDetail(testReservationId, testMemberId);
  }, [reservationId, memberId]);

  // 로딩 중이거나 에러가 있을 때 처리
  if (loading) {
    return (
      <div className="reservation-detail">
        <div className="reservation-detail__header">
          <button className="reservation-detail__back-btn" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="reservation-detail__title">예약 상세</h1>
        </div>
        <div className="reservation-detail__content">
          <div style={{ textAlign: 'center', padding: '50px 0' }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reservation-detail">
        <div className="reservation-detail__header">
          <button className="reservation-detail__back-btn" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="reservation-detail__title">예약 상세</h1>
        </div>
        <div className="reservation-detail__content">
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#ff4444' }}>{error}</div>
        </div>
      </div>
    );
  }

  const data = reservationData?.result || reservationData;

  console.log('=== 데이터 처리 단계 ===');
  console.log('reservationData:', reservationData);
  console.log('data:', data);

  if (!data) {
    return (
      <div className="reservation-detail">
        <div className="reservation-detail__header">
          <button className="reservation-detail__back-btn" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="reservation-detail__title">예약 상세</h1>
        </div>
        <div className="reservation-detail__content">
          <div style={{ textAlign: 'center', padding: '50px 0' }}>데이터가 없습니다.</div>
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
    
    if (data.reservationJimTypes && data.reservationJimTypes.length > 0) {
      data.reservationJimTypes.forEach(item => {
        total += item.count * item.pricePerHour * hours;
      });
    }
    
    const serviceTime = hours * 2; // 2시간씩 서비스 수수료
    const serviceFee = serviceTime * 200; // 시간당 200원
    
    return {
      itemTotal: total,
      serviceFee: serviceFee,
      total: total + serviceFee
    };
  };

  const pricing = calculateTotal();

  const handleCancel = async () => {
    try {
      const action = userRole === 'keeper' ? '거절' : '취소';
      console.log(action + '하기');
      
      // API 호출 예시 (실제 엔드포인트에 맞게 수정 필요)
      // await http.put(`/AirBnG/reservations/${reservationId}/cancel`);
      // 또는
      // await http.put(`/AirBnG/reservations/${reservationId}/reject`);
      
      // 성공 후 이전 페이지로 이동하거나 상태 업데이트
      // navigate(-1);
    } catch (err) {
      console.error('취소/거절 에러:', err);
      alert(err.response?.data?.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const handleConfirm = async () => {
    try {
      const action = userRole === 'keeper' ? '승인' : '확인';
      console.log(action);
      
      // API 호출 예시 (실제 엔드포인트에 맞게 수정 필요)
      // await http.put(`/AirBnG/reservations/${reservationId}/confirm`);
      // 또는
      // await http.put(`/AirBnG/reservations/${reservationId}/approve`);
      
      // 성공 후 이전 페이지로 이동하거나 상태 업데이트
      // navigate(-1);
    } catch (err) {
      console.error('확인/승인 에러:', err);
      alert(err.response?.data?.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const handleBackClick = () => {
    navigate(-1); // 이전 페이지로 돌아가기
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
            {data.reservationJimTypes && data.reservationJimTypes.map((item, index) => (
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
          {data.reservationJimTypes && data.reservationJimTypes.map((item, index) => (
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
            {userRole === 'keeper' ? '거절' : '취소'}
          </button>
          <button className="btn-confirm" onClick={handleConfirm}>
            {userRole === 'keeper' ? '승인' : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetail;