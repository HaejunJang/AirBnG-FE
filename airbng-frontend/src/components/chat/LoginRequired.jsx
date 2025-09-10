import { Link, useLocation } from 'react-router-dom';

export default function LoginRequired({ kind = '채팅' }) {
  const location = useLocation();

  return (
    <div style={{ padding: '40px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, opacity: 0.4 }}>💬</div>
      <h2 style={{ margin: '12px 0 8px' }}>{kind} 이용 안내</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        로그인 후 {kind} 기능을 사용할 수 있습니다.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link className="btn btn-primary" to="/page/login" state={{ from: location }}>
          로그인
        </Link>
        <Link className="btn btn-outline-primary" to="/page/signup">
          회원가입
        </Link>
      </div>
    </div>
  );
}
