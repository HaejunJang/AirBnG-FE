import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/pages/MyPage.css";

const MyPage = () => {
  const [sessionData, setSessionData] = useState({
    memberId: '',
    nickname: '',
    email: '',
    isLoggedIn: false
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState({
    show: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null
  });

  // 페이지 로드 시 초기화
  useEffect(() => {
    initializeMyPage();
  }, []);

  // 로그인 상태에 따른 UI 표시
  useEffect(() => {
    animatePageElements();
  }, [sessionData.isLoggedIn]);

  // JWT 토큰 디코딩 함수
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT 디코딩 실패:', error);
      return null;
    }
  };

  // JWT 토큰 만료 확인
  const isTokenExpired = (token) => {
    try {
      const decoded = decodeJWT(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Authorization 헤더에서 토큰 추출
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // 토큰 저장
  const setAuthToken = (token) => {
    localStorage.setItem('accessToken', token);
  };

  // 토큰 제거
  const removeAuthToken = () => {
    localStorage.removeItem('accessToken');
  };

  // 마이페이지 초기화
  const initializeMyPage = () => {
    checkLoginStatus();
    setupEventListeners();
  };

  // 로그인 상태 확인 (JWT 토큰 기반)
  const checkLoginStatus = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        setSessionData(prev => ({ ...prev, isLoggedIn: false }));
        return;
      }

      // 토큰 만료 확인
      if (isTokenExpired(token)) {
        console.log('토큰이 만료되었습니다.');
        removeAuthToken();
        setSessionData(prev => ({ ...prev, isLoggedIn: false }));
        return;
      }

      // 토큰에서 사용자 정보 추출
      const decoded = decodeJWT(token);
      if (!decoded) {
        removeAuthToken();
        setSessionData(prev => ({ ...prev, isLoggedIn: false }));
        return;
      }

      // 서버에 토큰 검증 요청 (선택적)
      const response = await fetch('/AirBnG/members/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.code === 2000 && data.data) {
          setSessionData({
            memberId: data.data.memberId || decoded.id,
            nickname: data.data.nickname,
            email: data.data.email,
            isLoggedIn: true
          });
        } else {
          // 서버에서 토큰이 유효하지 않다고 응답
          removeAuthToken();
          setSessionData(prev => ({ ...prev, isLoggedIn: false }));
        }
      } else if (response.status === 401) {
        // 토큰이 유효하지 않음
        removeAuthToken();
        setSessionData(prev => ({ ...prev, isLoggedIn: false }));
      } else {
        // 기타 오류 - 토큰이 있고 만료되지 않았다면 로그인 상태로 유지
        setSessionData({
          memberId: decoded.id,
          nickname: '', // 서버에서 받아올 수 없으면 빈값
          email: '',
          isLoggedIn: true
        });
      }
    } catch (error) {
      console.error('로그인 상태 확인 실패:', error);
      removeAuthToken();
      setSessionData(prev => ({ ...prev, isLoggedIn: false }));
    }
  };

  // 페이지 요소 애니메이션
  const animatePageElements = () => {
    setTimeout(() => {
      const elements = document.querySelectorAll('.welcome-section, .user-info-section, .menu-section, .limited-menu');
      elements.forEach((element, index) => {
        if (element && element.offsetParent !== null) {
          element.style.opacity = '0';
          element.style.transform = 'translateY(20px)';
          
          setTimeout(() => {
            element.style.transition = 'all 0.6s ease-out';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
          }, index * 100);
        }
      });
    }, 50);
  };

  // 이벤트 리스너 설정
  const setupEventListeners = () => {
  };

  // 로딩 애니메이션 표시
  const showLoadingAnimation = () => {
    setLoading(true);
  };

  // 로딩 애니메이션 숨김
  const hideLoadingAnimation = () => {
    setLoading(false);
  };

  // 모달 표시
  const showInfoModal = (title, message, onConfirm = null) => {
    setShowModal({
      show: true,
      type: 'info',
      title,
      message,
      onConfirm
    });
  };

  // 확인 모달 표시
  const showConfirmModal = (title, message, onConfirm) => {
    setShowModal({
      show: true,
      type: 'confirm',
      title,
      message,
      onConfirm
    });
  };

  // 에러 모달 표시
  const showErrorModal = (title, message) => {
    setShowModal({
      show: true,
      type: 'error',
      title,
      message,
      onConfirm: null
    });
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal({
      show: false,
      type: 'info',
      title: '',
      message: '',
      onConfirm: null
    });
  };

  // 로그인 페이지로 이동
  const goToLogin = () => {
    showLoadingAnimation();
    setTimeout(() => {
      window.location.replace('/AirBnG/page/login?redirect=/AirBnG/page/mypage');
    }, 300);
  };

  // 회원가입 페이지로 이동
  const goToSignup = () => {
    showLoadingAnimation();
    setTimeout(() => {
      window.location.replace('/AirBnG/page/signup?redirect=/AirBnG/page/mypage');
    }, 300);
  };

  // 내 정보 페이지로 이동
  const goToMyInfo = () => {
    if (!sessionData.isLoggedIn) {
      showInfoModal('로그인 필요', '로그인이 필요한 서비스입니다.', () => {
        closeModal();
        goToLogin();
      });
      return;
    }

    showLoadingAnimation();
    setTimeout(() => {
      window.location.href = '/AirBnG/page/myInfo';
    }, 300);
  };

  // 예약 내역 페이지로 이동
  const goToReservations = () => {
    if (!sessionData.isLoggedIn) {
      showInfoModal('로그인 필요', '로그인이 필요한 서비스입니다.', () => {
        closeModal();
        goToLogin();
      });
      return;
    }

    showLoadingAnimation();
    setTimeout(() => {
      window.location.href = '/AirBnG/page/reservations/list';
    }, 300);
  };

  // 로그아웃 (JWT 방식)
  const logout = () => {
    showConfirmModal('로그아웃', '정말로 로그아웃하시겠습니까?', async () => {
      closeModal();
      showLoadingAnimation();

      try {
        const token = getAuthToken();
        
        if (token) {
          // 서버에 로그아웃 요청 (토큰 무효화)
          const response = await fetch('/AirBnG/members/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();
          console.log('서버 응답 데이터:', data);

          if (data.code === 2000) {
            console.log('서버 로그아웃 성공:', data.message);
          } else {
            console.error('서버 로그아웃 실패:', data.message);
          }
        }

        // 클라이언트 토큰 제거 및 상태 초기화
        removeAuthToken();
        setSessionData({
          memberId: '',
          nickname: '',
          email: '',
          isLoggedIn: false
        });

        setTimeout(() => {
          hideLoadingAnimation();
          console.log('로그아웃 완료');
        }, 500);

      } catch (error) {
        console.error('로그아웃 API 요청 실패:', error);
        
        // 네트워크 오류 등으로 실패해도 클라이언트 정리는 수행
        removeAuthToken();
        setSessionData({
          memberId: '',
          nickname: '',
          email: '',
          isLoggedIn: false
        });
        
        hideLoadingAnimation();
        showErrorModal('알림', '서버와의 통신에 문제가 있었지만 로그아웃이 완료되었습니다.');
      }
    });
  };

  // 웰컴 섹션 컴포넌트
  const WelcomeSection = () => (
    <div className="welcome-section">
      <div className="welcome-content">
        <h1 className="welcome-title">환영합니다!</h1>
        <p className="welcome-subtitle">로그인하여 더 많은 서비스를 이용해보세요.</p>
        <div className="welcome-buttons">
          <button className="btn btn-primary" onClick={goToLogin}>
            로그인
          </button>
          <button className="btn btn-secondary" onClick={goToSignup}>
            회원가입
          </button>
        </div>
      </div>
    </div>
  );

  // 로그아웃 상태 메뉴
  const LoggedOutMenu = () => (
    <div className="limited-menu">
      <div className="menu-item disabled">
        <div className="menu-icon user-icon"></div>
        <div className="menu-content">
          <h3>내 정보</h3>
          <p>로그인이 필요한 서비스입니다</p>
        </div>
        <div className="menu-arrow lock-icon"></div>
      </div>

      <div className="menu-item disabled">
        <div className="menu-icon calendar-icon"></div>
        <div className="menu-content">
          <h3>예약 내역</h3>
          <p>로그인이 필요한 서비스입니다</p>
        </div>
        <div className="menu-arrow lock-icon"></div>
      </div>
    </div>
  );

  // 로그인 상태 메뉴
  const LoggedInMenu = () => (
    <>
      {/* 사용자 정보 섹션 */}
      <div className="user-info-section">
        <div className="user-profile">
          <div className="profile-image">
            <div className="profile-avatar"></div>
          </div>
          <div className="user-details">
            <h2 className="username">
              {sessionData.nickname ? `${sessionData.nickname}님` : '사용자님'}
            </h2>
          </div>
        </div>
      </div>

      {/* 메뉴 섹션 */}
      <div className="menu-section">
        <div className="menu-item active" onClick={goToMyInfo}>
          <div className="menu-icon user-icon"></div>
          <div className="menu-content">
            <h3>내 정보 보기/수정</h3>
            <p>개인정보를 확인하고 수정하세요</p>
          </div>
          <div className="menu-arrow right-arrow"></div>
        </div>

        <div className="menu-item active" onClick={goToReservations}>
          <div className="menu-icon calendar-icon"></div>
          <div className="menu-content">
            <h3>예약 내역 보기</h3>
            <p>나의 예약 현황을 확인하세요</p>
          </div>
          <div className="menu-arrow right-arrow"></div>
        </div>

        <div className="menu-item logout" onClick={logout}>
          <div className="menu-icon logout-icon"></div>
          <div className="menu-content">
            <h3>로그아웃</h3>
            <p>안전하게 로그아웃하세요</p>
          </div>
          <div className="menu-arrow right-arrow"></div>
        </div>
      </div>
    </>
  );

  // 모달 컴포넌트
  const Modal = () => {
    if (!showModal.show) return null;

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{showModal.title}</h3>
          </div>
          <div className="modal-body">
            <p>{showModal.message}</p>
          </div>
          <div className="modal-footer">
            {showModal.type === 'confirm' ? (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={closeModal}
                >
                  취소
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    if (showModal.onConfirm) {
                      showModal.onConfirm();
                    } else {
                      closeModal();
                    }
                  }}
                >
                  확인
                </button>
              </>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (showModal.onConfirm) {
                    showModal.onConfirm();
                  } else {
                    closeModal();
                  }
                }}
              >
                확인
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 로딩 컴포넌트
  const Loading = () => {
    if (!loading) return null;

    return (
      <div className="loading-overlay">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>처리 중...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      {/* 헤더 */}
      <header className="header">
      </header>

      {/* 메인 컨텐츠 */}
      <main className="main-content">
        {!sessionData.isLoggedIn ? (
          <>
            <WelcomeSection />
            <LoggedOutMenu />
          </>
        ) : (
          <LoggedInMenu />
        )}
      </main>

      {/* 모달 */}
      <Modal />
      
      {/* 로딩 */}
      <Loading />

      {/* 네비게이션 바 (필요시 추가) */}
      {/* <Navbar /> */}
    </div>
  );
};

export default MyPage;