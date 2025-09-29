import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import EmptyIcon from "../../assets/locker_empty_ic.svg";
import "../../styles/pages/locker.css";

export default function LockerWelcome() {
  const nav = useNavigate();
  return (
    <div className="airbng-locker">
      <div className="container">
        <Header headerTitle="보관소" />
        <main className="main-content">
          <div className="empty-locker-section">
            <div className="empty-locker-icon">
              <img src={EmptyIcon} alt="보관소 아이콘" />
            </div>
            <h2 className="empty-locker-title">보관소 서비스 이용 안내</h2>
            <p className="empty-locker-subtext">
              로그인 후 보관소 등록/관리 기능을 사용할 수 있습니다.
            </p>
            <div className="welcome-buttons">
              <button className="login-btn" onClick={() => nav("/page/login?redirect=/page/lockers")}>로그인</button>
              <button className="signup-btn" onClick={() => nav("/page/signup")}>회원가입</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
