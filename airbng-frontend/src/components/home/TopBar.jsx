import React from "react";
import { Link } from "react-router-dom";
import logoImg from "../../assets/logo_ic.svg";
import bellImg from "../../assets/bell_ic.svg";

function TopBar() {
  return (
    <div className="top-bar">
      <div className="logo-group">
        <img src={logoImg} alt="로고" />
      </div>

      <div className="bell-wrapper">
        <Link to="/page/notification" className="notification-link">
          <img src={bellImg} alt="알림" className="notification-icon" />
        </Link>
      </div>
    </div>
  );
}

export default TopBar;
