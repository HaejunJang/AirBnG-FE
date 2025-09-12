import { Link, useLocation } from 'react-router-dom';

export default function LoginRequired({ kind = '채팅' }) {
  const location = useLocation();

  return (
    <section className="auth-required">
      <div className="auth-required__icon">💬</div>
      <h2 className="auth-required__title">{kind} 이용 안내</h2>
      <p className="auth-required__desc">
        로그인 후 {kind} 기능을 사용할 수 있습니다.
      </p>
      <div className="auth-required__actions">
        <Link className="btn btn--primary" to="/page/login" state={{ from: location }}>
          로그인
        </Link>
        <Link className="btn btn--outline" to="/page/signup">
          회원가입
        </Link>
      </div>
    </section>
  );
}
