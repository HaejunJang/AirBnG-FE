import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/MyPage.css';

export default function MyPage() {
  const { user, ready, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ---- 로딩 & 모달 상태 ----
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState({
    show: false,
    type: 'info', // 'info' | 'confirm' | 'error'
    title: '',
    message: '',
    onConfirm: null,
  });

  // ---- 애니메이션 ----
  const animatePageElements = useCallback(() => {
    setTimeout(() => {
      const elements = document.querySelectorAll(
        '.welcome-section, .user-info-section, .menu-section, .limited-menu'
      );
      elements.forEach((el, index) => {
        if (el && el.offsetParent !== null) {
          el.style.opacity = '0';
          el.style.transform = 'translateY(20px)';
          setTimeout(() => {
            el.style.transition = 'all 0.6s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, index * 100);
        }
      });
    }, 50);
  }, []);

  useEffect(() => {
    if (ready) animatePageElements();
  }, [ready, isLoggedIn, animatePageElements]);

  // ---- 모달/로딩 핸들러 ----
  const showLoading = () => setLoading(true);
  const hideLoading = () => setLoading(false);

  const showInfoModal = (title, message, onConfirm = null) =>
    setShowModal({ show: true, type: 'info', title, message, onConfirm });

  const showConfirmModal = (title, message, onConfirm) =>
    setShowModal({ show: true, type: 'confirm', title, message, onConfirm });

  const showErrorModal = (title, message) =>
    setShowModal({ show: true, type: 'error', title, message, onConfirm: null });

  const closeModal = () =>
    setShowModal({ show: false, type: 'info', title: '', message: '', onConfirm: null });

  // ---- 네비게이션 핸들러 ----
  const redirectParam = encodeURIComponent(location.pathname);

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

  const requireLoginThen = (task) => {
    if (!isLoggedIn) {
      showInfoModal('로그인 필요', '로그인이 필요한 서비스입니다.', () => {
        closeModal();
        goToLogin();
      });
      return false;
    }
    return true;
  };

  const goToMyInfo = () => {
    if (!requireLoginThen(goToMyInfo)) return;
    showLoading();
    setTimeout(() => {
      navigate('/page/myInfo');
    }, 300);
  };

  const goToReservations = () => {
    if (!requireLoginThen(goToReservations)) return;
    showLoading();
    setTimeout(() => {
      navigate('/page/reservations/list');
    }, 300);
  };

  // ---- 로그아웃 ----
  const onLogout = () => {
    showConfirmModal('로그아웃', '정말로 로그아웃하시겠습니까?', async () => {
      closeModal();
      showLoading();
      try {
        await logout(); // AuthContext가 서버 요청 + 클라이언트 정리
      } catch (e) {
        showErrorModal('알림', '서버와 통신 중 문제가 있었지만 로그아웃을 완료했습니다.');
      } finally {
        setTimeout(hideLoading, 400);
      }
    });
  };

  // ---- 섹션 컴포넌트 ----
  const WelcomeSection = () => (
    <div className="welcome-section">
      <div className="welcome-content">
        <h1 className="welcome-title">환영합니다!</h1>
        <p className="welcome-subtitle">로그인하여 더 많은 서비스를 이용해보세요.</p>
        <div className="welcome-buttons">
          <button className="btn btn-primary" onClick={goToLogin}>로그인</button>
          <button className="btn btn-secondary" onClick={goToSignup}>회원가입</button>
        </div>
      </div>
    </div>
  );

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

  const LoggedInMenu = () => (
    <>
      {/* 사용자 정보 섹션 */}
      <div className="user-info-section">
        <div className="user-profile">
          <div className="profile-image"><div className="profile-avatar" /></div>
          <div className="user-details">
            <h2 className="username">{user?.name ? `${user.name}님` : '사용자님'}</h2>
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

        <div className="menu-item logout" onClick={onLogout}>
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

  const Modal = () => {
    if (!showModal.show) return null;
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h3>{showModal.title}</h3></div>
          <div className="modal-body"><p>{showModal.message}</p></div>
          <div className="modal-footer">
            {showModal.type === 'confirm' ? (
              <>
                <button className="btn btn-secondary" onClick={closeModal}>취소</button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (showModal.onConfirm) showModal.onConfirm();
                    else closeModal();
                  }}
                >
                  확인
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (showModal.onConfirm) showModal.onConfirm();
                  else closeModal();
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

  // ---- 렌더링 ----
  if (!ready) {
    return (
      <div className="container">
        <main className="main-content"><p>로딩 중…</p></main>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header" />
      <main className="main-content">
        {!isLoggedIn || !user?.id ? (
          <>
            <WelcomeSection />
            <LoggedOutMenu />
          </>
        ) : (
          <LoggedInMenu />
        )}
      </main>

      {/* 모달 & 로딩 */}
      <Modal />
      <Loading />
    </div>
  );
}
