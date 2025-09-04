import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Footer/Navbar";
import "./styles/App.css";

import HomePage from "./pages/HomePage";
import LockerManagePage from "./pages/LockerManagePage";
import LockerRegisterPage from "./pages/LockerRegisterPage";
import LockerRootPage from "./pages/LockerRootPage";

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

    return (
      <div className="airbng-home">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/page/home" element={<HomePage />} />
          <Route path="/page/lockers" element={<LockerRootPage />} />
          <Route path="/page/lockers/manage" element={<LockerManagePage />} />
          <Route path="/page/lockers/register" element={<LockerRegisterPage />} />
        </Routes>
        <Navbar active={active} />
        
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
