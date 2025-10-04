import { Link, useLocation } from 'react-router-dom';
import '../../styles/chat.css';

export default function LoginRequired({ kind = '채팅' }) {
  const location = useLocation();

  return (
    <section className="auth-required">
      <h2 className="auth-required__title">환영합니다!</h2>
      <p className="auth-required__desc">
        {kind} 기능을 이용하려면
        <br />
        로그인 또는 회원가입이 필요합니다.
      </p>
      <div className="auth-required__actions">
        <Link
          className="btn login-btn"
          to={`/page/login?redirect=${encodeURIComponent(location.pathname)}`}
          state={{ from: location }}
        >
          로그인
        </Link>
        <Link
          className="btn signup-btn"
          to={`/page/signup?redirect=${encodeURIComponent(location.pathname)}`}
        >
          회원가입
        </Link>
      </div>
    </section>
  );
}
