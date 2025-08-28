import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Footer/Navbar";
import "./styles/App.css";

import HomePage from "./pages/HomePage";

function App() {
  function getActiveNav(pathname) {
    if (pathname.startsWith("/page/lockers")) return "locker";
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
