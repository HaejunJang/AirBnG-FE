import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Footer/Navbar";
import "./styles/App.css";

import ReservationDetail from "./pages/ReservationDetail";
import HomePage from "./pages/HomePage";
import ReservationFormPage from "./pages/ReservationFormPage";

import "./styles/App.css";

function App() {
  function getActiveNav(pathname) {
    if (pathname.startsWith("/page/lockers")) return "cart";
    if (pathname.startsWith("/page/chatList")) return "chat";
    if (pathname.startsWith("/page/reservations")) return "calendar";
    if (pathname.startsWith("/page/mypage")) return "mypage";
    return "home";
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
          <Route
            path="/page/reservations/detail/:id"
            element={<ReservationDetail />}
          />
          <Route
            path="/page/reservations/form"
            element={<ReservationFormPage />}
          />
        </Routes>
        {!shouldHideNavbar && <Navbar active={active} />}
      </div>
    );
  }

  return (
    <BrowserRouter>
      <MainContent />
    </BrowserRouter>
  );
}

export default App;
