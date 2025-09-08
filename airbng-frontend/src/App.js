import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Footer/Navbar";
import "./styles/App.css";

import ReservationDetail from "./pages/ReservationDetail";
import HomePage from "./pages/HomePage";
import LockerManagePage from "./pages/LockerManagePage";
import LockerRegisterPage from "./pages/LockerRegisterPage";
import LockerRootPage from "./pages/LockerRootPage";
import ReservationFormPage from "./pages/ReservationFormPage";
import MyPage from "./pages/MyPage";
import SignupPage from "./pages/SignupPage";
import ReservationList from "./pages/ReservationList";
import Notification from "./pages/notification";
import { SSEProvider } from "./context/SseContext";
import {useAuth} from "./context/AuthContext";
import Notification from "./pages/nofication";
import LoginPage from "./pages/LoginPage";
import Notification from "./pages/notification";
import { SSEProvider } from "./context/SseContext";
import {useAuth} from "./context/AuthContext";

function App() {
  function getActiveNav(pathname) {
    if (pathname.startsWith("/page/lockers")) return "cart";
    if (pathname.startsWith("/page/chatList")) return "chat";
    if (pathname.startsWith("/page/reservations")) return "calendar";
    if (pathname.startsWith("/page/mypage")) return "mypage";
  }

  function MainContent() {
    const location = useLocation();
    const active = getActiveNav(location.pathname);

    // 네비바를 숨길 페이지들 정의
    const hideNavbarPaths = [
      "/page/reservations/detail",
      "/page/reservations/form",
    ];

    // 현재 경로가 네비바를 숨겨야 하는 경로인지 확인
    const shouldHideNavbar = hideNavbarPaths.some((path) =>
      location.pathname.startsWith(path)
    );

    return (
      <div className="airbng-home">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/page/home" element={<HomePage />} />
          <Route path="/page/lockers" element={<LockerRootPage />} />
          <Route path="/page/lockers/manage" element={<LockerManagePage />} />
          <Route path="/page/lockers/register" element={<LockerRegisterPage />} />
          <Route path="/page/reservations/list" element={<ReservationList />} />
          <Route
            path="/page/reservations/detail/:id"
            element={<ReservationDetail />}
          />
          <Route
            path="/page/reservations/form"
            element={<ReservationFormPage />}
          />
          <Route path="/page/mypage" element={<MyPage />} />
          <Route path="/page/signup" element={<SignupPage />} />
          <Route path="/page/notification" element={<Notification />} />

          <Route path="/page/notification" element={<Notification/>} />
          <Route path="/page/login" element={<LoginPage />} />
          <Route path="/page/notification" element={<Notification />} />

        </Routes>
        {!shouldHideNavbar && <Navbar active={active} />}
      </div>
    );
  }

  const user = useAuth();

  return (
      <BrowserRouter>
          {/* 앱 전체 SSEProvider 적용 */}
          {/*<SSEProvider memberId={user?.id || null}> ->  실제 로그인 사용자별 알림 코드*/}
          <SSEProvider memberId = "3">
            <MainContent />
          </SSEProvider>
      </BrowserRouter>
  );
}

export default App;
