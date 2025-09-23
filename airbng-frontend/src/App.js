import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { getStompClient } from "./utils/stompClient";
import { useEffect } from "react";
import Navbar from "./components/Footer/Navbar";
import WsPersonalBridge from "./components/ws/WsPersonalBridge";
import { UnreadProvider } from "./context/UnreadContext";
import "./styles/App.css";

import ReservationDetail from "./pages/ReservationDetail";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import SearchFilterPage from "./pages/SearchFilterPage";
import LockerManagePage from "./pages/LockerManagePage";
import LockerRegisterPage from "./pages/LockerRegisterPage";
import LockerRootPage from "./pages/LockerRootPage";
import ReservationFormPage from "./pages/ReservationFormPage";
import MyPage from "./pages/MyPage";
import SignupPage from "./pages/SignupPage";
import ReservationList from "./pages/ReservationList";
import LoginPage from "./pages/LoginPage";
import ChatListPage from "./pages/ChatListPage";
import ChatStartPage from "./pages/ChatStartPage";
import ChatRoomPage from "./pages/ChatRoomPage";
import LockerDetailsPage from "./pages/LockerDetailsPage";
import Notification from "./pages/notification";
import { SSEProvider } from "./context/SseContext";
import { getUserProfile } from "./utils/jwtUtil";
import MyInfoPage from "./pages/MyInfoPage";
import MyWallet from "./pages/MyWallet";
import AccountRegister from "./pages/AccountRegister";
import MyWalletCharge from "./pages/MyWalletCharge";
import MyWalletWithdraw from "./pages/MyWalletWithdraw";
import MyWalletHistory from "./pages/MyWalletHistory";

function App() {
  useEffect(() => {
    const c = getStompClient();
    if (!c.active) c.activate();          // ← 최초 1회 연결
    return () => { c.deactivate(); };     // 앱 unload 시 정리
  }, []);

  function getActiveNav(pathname) {
    if (pathname.startsWith("/page/lockers")) return "cart";
    if (pathname.startsWith("/page/chatList")) return "chat";
    if (pathname.startsWith("/page/reservations")) return "calendar";
    if (pathname.startsWith("/page/mypage")) return "mypage";
    if (pathname.startsWith("/page/login")) return "mypage";
    if (pathname.startsWith("/page/signup")) return "mypage";
    return "home";
  }

  function MainContent() {
    const location = useLocation();
    const active = getActiveNav(location.pathname);

    // 네비바를 숨길 페이지들 정의
    const hideNavbarPaths = [
      "/page/reservations/detail",
      "/page/reservations/form",
      "/page/lockers/manage", 
      "/page/lockers/register",
      "/page/chat/new",
      "/page/mypage/update",
    ];

    // 채팅방 상세 경로는 별도 처리
    const shouldHideNavbar =
      hideNavbarPaths.some((path) => location.pathname.startsWith(path)) ||
      /^\/page\/chat\/\d+/.test(location.pathname);

    return (
      <div className="airbng-home">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/page/home" element={<HomePage />} />
          <Route path="/page/lockerSearchDetails" element={<SearchPage />} />
          <Route path="/page/lockerSearch" element={<SearchFilterPage />} />
          <Route path="/page/lockers" element={<LockerRootPage />} />
          <Route path="/page/lockers/manage" element={<LockerManagePage />} />
          <Route
            path="/page/lockers/register"
            element={<LockerRegisterPage />}
          />

          <Route
            path="/page/lockers/:lockerId"
            element={<LockerDetailsPage />}
          />
          <Route path="/page/lockerDetails" element={<LockerDetailsPage />} />
          <Route path="/page/reservations/list" element={<ReservationList />} />
          <Route
            path="/page/reservations/detail/:reservationId"
            element={<ReservationDetail />}
          />
          <Route
            path="/page/reservations/form"
            element={<ReservationFormPage />}
          />
          <Route path="/page/mypage" element={<MyPage />} />
          <Route path="/page/signup" element={<SignupPage />} />
          <Route path="/page/login" element={<LoginPage />} />
          <Route path="/page/chatList" element={<ChatListPage />} />
          <Route path="/page/chat/new" element={<ChatStartPage />} />
          <Route path="/page/chat/:convId" element={<ChatRoomPage />} />
          <Route path="/page/mypage/update" element={<MyInfoPage />} />
          <Route path="/page/notification" element={<Notification />} />

          <Route path="/page/mypage/wallet" element={<MyWallet />} />
          <Route
            path="/page/mypage/account/add"
            element={<AccountRegister />}
          />
          <Route
            path="/page/mypage/wallet/charge"
            element={<MyWalletCharge />}
          />
          <Route
            path="/page/mypage/wallet/withdraw"
            element={<MyWalletWithdraw />}
          />
          <Route
            path="/page/mypage/wallet/history"
            element={<MyWalletHistory />}
          />
          <Route path="/page/mypage/update" element={<MyInfoPage />} />
        </Routes>
        {!shouldHideNavbar && <Navbar active={active} />}
      </div>
    );
  }

  const profile = getUserProfile();

  return (
    <BrowserRouter>
      <UnreadProvider>
        <WsPersonalBridge />
        <SSEProvider memberId={profile?.id || null}>
            <MainContent />
        </SSEProvider>
      </UnreadProvider>
    </BrowserRouter>
  );
}

export default App;
