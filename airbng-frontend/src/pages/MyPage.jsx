import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header/Header";
import { Modal, useModal } from "../components/common/ModalUtil";
import "../styles/pages/MyPage.css";
import { infoApi } from "../api/infoApi";

export default function MyPage() {
  const { user, ready, isLoggedIn, logout, setUser } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // ---- 세션 스토리지에서 프로필 정보 가져오기 ----
  const getSessionUserProfile = () => {
    try {
      const storedProfile = sessionStorage.getItem("userProfile");
      return storedProfile ? JSON.parse(storedProfile) : null;
    } catch (e) {
      console.error("세션 스토리지에서 프로필 정보를 가져오는 중 오류:", e);
      return null;
    }
  };

  const [sessionProfile, setSessionProfile] = useState(getSessionUserProfile());

  // ---- 프로필 갱신 함수 ----
  const updateSessionProfile = useCallback((newProfileData) => {
    try {
      const currentProfile = getSessionUserProfile();
      const updatedProfile = { ...currentProfile, ...newProfileData };

      sessionStorage.setItem("userProfile", JSON.stringify(updatedProfile));
      setSessionProfile(updatedProfile);

      console.log("프로필 정보가 갱신되었습니다:", updatedProfile);
    } catch (e) {
      console.error("프로필 정보 갱신 중 오류:", e);
    }
  }, []);

  // ---- 서버에서 최신 프로필 정보를 가져와서 세션 스토리지 업데이트 ----
  const refreshProfileFromServer = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await infoApi.getUserInfo(user.id);
      if (response.status === 200 && response.data.code === 1000) {
        const serverData = response.data.result;

        // 서버 데이터로 세션 스토리지 업데이트
        const updatedProfile = {
          id: serverData.memberId,
          nickname: serverData.nickname,
          profileImageUrl: serverData.url || serverData.profileImageUrl, // 서버 응답에 따라 조정
          roles: sessionProfile?.roles || ["USER"], // 기존 roles 유지
        };

        updateSessionProfile(updatedProfile);

        // AuthContext의 user 상태도 업데이트
        setUser((prev) => ({
          ...prev,
          nickname: serverData.nickname,
          profileImageUrl: updatedProfile.profileImageUrl,
        }));

        return updatedProfile;
      }
    } catch (error) {
      console.error("서버에서 프로필 정보를 가져오는 중 오류:", error);
    }
  }, [user?.id, sessionProfile?.roles, updateSessionProfile, setUser]);

  // ---- 로딩 & 모달 상태 ----
  const [loading, setLoading] = useState(false);
  const { modalState, hideModal, showError, showLogin, showConfirm } =
    useModal();

  //  짐페이 잔액 상태
  const [balance, setBalance] = useState(null);
  const [balLoading, setBalLoading] = useState(false);
  const [balError, setBalError] = useState("");

  // ---- 금액 포맷터 ----
  const formatWon = (v) => {
    if (v == null) return "-";
    const num = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(num)) return "-";
    return new Intl.NumberFormat("ko-KR").format(num) + "원";
  };

  // ---- 애니메이션 ----
  const animatePageElements = useCallback(() => {
    setTimeout(() => {
      const elements = document.querySelectorAll(
        ".welcome-section, .user-info-section, .menu-section, .limited-menu"
      );
      elements.forEach((el, index) => {
        if (el && el.offsetParent !== null) {
          el.style.opacity = "0";
          el.style.transform = "translateY(20px)";
          setTimeout(() => {
            el.style.transition = "all 0.6s ease-out";
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }, index * 100);
        }
      });
    }, 50);
  }, []);

  // ---- 세션 스토리지 감시 및 페이지 포커스 시 갱신 ----
  useEffect(() => {
    const handleStorageChange = () => {
      setSessionProfile(getSessionUserProfile());
    };

    const handleFocus = () => {
      // 페이지가 포커스를 받을 때 프로필 정보 새로고침
      refreshProfileFromServer();
    };

    const handleVisibilityChange = () => {
      // 페이지가 다시 보일 때 프로필 정보 새로고침
      if (!document.hidden) {
        refreshProfileFromServer();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshProfileFromServer]);

  // ---- URL 파라미터 감시 (프로필 수정 페이지에서 돌아올 때) ----
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const profileUpdated = urlParams.get("profileUpdated");

    if (profileUpdated === "true") {
      // URL 파라미터 제거
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // 프로필 정보 새로고침
      refreshProfileFromServer();
    }
  }, [location.search, refreshProfileFromServer]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchAndSetUser = async () => {
      try {
        setBalLoading(true);
        setBalError("");
        const response = await infoApi.getUserInfo(user.id);
        if (response.status === 200 && response.data.code === 1000) {
          const r = response.data.result; // { memberId, nickname, url, balance, ... }
          // balance 세팅
          setBalance(r?.balance ?? 0);

          // user 상태 병합 (닉네임 등 최신화; 프로필 이미지는 세션 값 사용 원칙 유지)
          setUser((prev) => ({
            ...prev,
            nickname: r?.nickname ?? prev?.nickname ?? "",
            id: r?.memberId ?? prev?.id ?? null,
            // profileImageUrl는 세션값 쓰라고 하셨으니 건드리지 않음
          }));
        } else {
          setBalError(
            response.data?.message || "마이페이지 정보를 불러오지 못했어요."
          );
        }
      } catch (e) {
        setBalError("네트워크 오류가 발생했어요.");
      } finally {
        setBalLoading(false);
      }
    };
    fetchAndSetUser();
  }, [user?.id, setUser]);

  useEffect(() => {
    if (ready) animatePageElements();
  }, [ready, isLoggedIn, animatePageElements]);

  // ---- 모달/로딩 핸들러 ----
  const showLoading = () => setLoading(true);
  const hideLoading = () => setLoading(false);

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
      showLogin();
      return false;
    }
    return true;
  };

  const goToMyInfo = () => {
    if (!requireLoginThen(goToMyInfo)) return;
    showLoading();
    setTimeout(() => {
      navigate(`/page/mypage/update?memberId=${user.id}`, { replace: true });
    }, 300);
  };

  const goToReservations = () => {
    if (!requireLoginThen(goToReservations)) return;
    showLoading();
    setTimeout(() => {
      navigate("/page/reservations/list");
    }, 300);
  };

  // ---- 로그아웃 ----
  const onLogout = () => {
    showConfirm("로그아웃", "정말로 로그아웃하시겠습니까?", async () => {
      showLoading();
      try {
        await logout(); // AuthContext가 서버 요청 + 클라이언트 정리
      } catch (e) {
        showError(
          "알림",
          "서버와 통신 중 문제가 있었지만 로그아웃을 완료했습니다."
        );
      } finally {
        setTimeout(hideLoading, 400);
      }
    });
  };

  // ---- 프로필 이미지 렌더링 함수 ----
  const renderProfileImage = () => {
    const profileImageUrl = sessionProfile?.profileImageUrl;

    if (profileImageUrl) {
      return (
        <img
          src={profileImageUrl}
          alt="프로필"
          className="profile-image-real"
          onError={(e) => {
            // 이미지 로드 실패시 기본 아바타로 대체
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "block";
          }}
        />
      );
    }

    // 기본 아바타
    return <div className="profile-avatar" />;
  };

  // ---- 사용자 정보 표시 함수 ----
  const getUserDisplayInfo = () => {
    // 세션 스토리지의 닉네임을 우선 사용, 없으면 user 객체의 닉네임 사용
    const displayName = sessionProfile?.nickname || user?.nickname || "사용자";
    const userId = sessionProfile?.id || user?.id;

    return {
      name: displayName,
      id: userId,
    };
  };

  // ✅ 짐페이 포인트 한 줄 카드
  const WalletPointRow = () => (
    <div
      className="wallet-card"
      onClick={() => navigate("/page/mypage/wallet")}
      role="button"
    >
      <div className="wallet-row">
        <span className="wallet-label">현재 짐페이</span>
        <span className="wallet-amount">
          {balLoading ? "불러오는 중…" : balError ? "—" : formatWon(balance)}
        </span>
        <span className="wallet-chevron" aria-hidden>
          ›
        </span>
      </div>
    </div>
  );

  // ---- 섹션 컴포넌트 ----
  const WelcomeSection = () => (
    <div className="welcome-section">
      <div className="welcome-content">
        <h1 className="welcome-title">환영합니다!</h1>
        <p className="welcome-subtitle">
          로그인하여 더 많은 서비스를 이용해보세요.
        </p>
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

  const LoggedInMenu = () => {
    const userInfo = getUserDisplayInfo();

    return (
      <>
        {/* 사용자 정보 섹션 */}
        <div className="user-info-section">
          <div className="user-profile">
            <div className="profile-image-container">
              {renderProfileImage()}
              <div
                className="profile-avatar"
                style={{
                  display: sessionProfile?.profileImageUrl ? "none" : "block",
                }}
              />
            </div>
            <div className="user-details">
              <div className="user-greeting">
                <h2 className="username">{userInfo.name}님</h2>
                <div className="user-subtitle">안녕하세요! </div>
              </div>
            </div>
          </div>
          <WalletPointRow />
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
        <main className="main-content">
          <p>로딩 중…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      <Header headerTitle="마이페이지" />
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
      <Loading />
    </div>
  );
}
