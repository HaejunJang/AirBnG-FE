import React from 'react';
import cartIcon from '../../assets/shopping-cart.svg';
import chatIcon from '../../assets/messages.svg';
import homeIcon from '../../assets/home.svg';
import calendarIcon from '../../assets/calendar.svg';
import userIcon from '../../assets/user.svg';
import { useUnread } from '../../context/UnreadContext';
import { useAuth } from '../../context/AuthContext';

import "../../styles/layout/navigation.css";

function Navbar({ active = "home" }) {
  const { total } = useUnread();              // 전체 미확인 개수
  const { isLoggedIn } = useAuth() || {};
  const showBadge = !!isLoggedIn && total > 0;

  return (
    <nav className="bottom-nav">
      <a href="/page/lockers" className={`nav-item${active === "cart" ? " active" : ""}`}>
        <img src={cartIcon} alt="보관소" className="nav-icon" />
        <span className="nav-text">보관소</span>
      </a>

      <a href="/page/chatList" className={`nav-item${active === "chat" ? " active" : ""}`}>
        {showBadge ? (
          <span className="nav-icon-wrap">
            <img src={chatIcon} alt="채팅" className="nav-icon" />
            <span className="nav-badge">{total > 99 ? '99+' : total}</span>
          </span>
        ) : (
          <img src={chatIcon} alt="채팅" className="nav-icon" />
        )}
        <span className="nav-text">채팅</span>
      </a>

      <a href="/page/home" className={`nav-item${active === "home" ? " active" : ""}`}>
        <img src={homeIcon} alt="홈" className="nav-icon" />
        <span className="nav-text">홈</span>
      </a>

      <a href="/page/reservations/list" className={`nav-item${active === "calendar" ? " active" : ""}`}>
        <img src={calendarIcon} alt="예약" className="nav-icon" />
        <span className="nav-text">예약</span>
      </a>

      <a href="/page/mypage" className={`nav-item${active === "mypage" ? " active" : ""}`}>
        <img src={userIcon} alt="마이" className="nav-icon" />
        <span className="nav-text">마이</span>
      </a>
    </nav>
  );
}

export default Navbar;
