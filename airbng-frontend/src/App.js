import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Footer/Navbar";
import "./styles/App.css";

import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import SearchFilterPage from "./pages/SearchFilterPage";

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
      <div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/page/home" element={<HomePage />} />
          <Route path="/page/lockerSearchDetails" element={<SearchPage />} />
          <Route path="/page/lockerSearch" element={<SearchFilterPage />} />
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
