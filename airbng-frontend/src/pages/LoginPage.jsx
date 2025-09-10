import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/login.css';

const COOLDOWN_KEY = 'loginCooldownUntil';
const FAIL_COUNT_KEY = 'loginFailCount';
const MAX_ATTEMPTS = 5;
const DEFAULT_COOLDOWN = 30;

const cdKeyFor = (email) => `${COOLDOWN_KEY}:${(email || '').toLowerCase().trim()}`;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get('redirect') || '/page/home';
  }, [location.search]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);             // 자동 로그인 상태
  const [submitting, setSubmitting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const [modal, setModal] = useState({
    open: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
  });

  const showModal = (type, title, message, onConfirm = null) =>
    setModal({ open: true, type, title, message, onConfirm });
  const closeModal = () =>
    setModal({ open: false, type: 'info', title: '', message: '', onConfirm: null });

  useEffect(() => {
    const saved = Number(sessionStorage.getItem(cdKeyFor(email)) || 0);
    setCooldownUntil(saved);
  }, [email]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const tick = () => {
      const remain = Math.max(0, Math.floor((cooldownUntil - Date.now()) / 1000));
      setCountdown(remain);
      if (remain <= 0) {
        sessionStorage.removeItem(cdKeyFor(email));
        setCooldownUntil(0);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil, email]);

  const startCooldown = useCallback((sec) => {
    const end = Date.now() + (Number(sec) > 0 ? Number(sec) : DEFAULT_COOLDOWN) * 1000;
    sessionStorage.setItem(cdKeyFor(email), String(end));
    setCooldownUntil(end);
  }, [email]);

  const getFailCount = () => Number(sessionStorage.getItem(FAIL_COUNT_KEY) || '0');
  const setFailCount = (n) => sessionStorage.setItem(FAIL_COUNT_KEY, String(n));
  const resetFailCount = () => sessionStorage.removeItem(FAIL_COUNT_KEY);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (submitting || cooldownUntil) return;

    if (!email.trim() || !password.trim()) {
      showModal('error', '로그인 실패', '이메일/비밀번호를 확인해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      // remember 값을 함께 전달
      const r = await login({ email, password, remember });

      if (r?.ok) {
        resetFailCount();
        showModal('info', '로그인 성공', '정상적으로 로그인되었습니다.', () => {
          closeModal();
          navigate(redirect, { replace: true });
        });
        return;
      }

      if (r?.status === 429 || r?.code === 8003) {
        const sec = Number(r?.retryAfter || DEFAULT_COOLDOWN);
        startCooldown(sec);
        showModal('warning', '요청이 너무 많습니다', `${sec}초 후 다시 시도해주세요.`);
        return;
      }

      const next = getFailCount() + 1;
      setFailCount(next);
      if (next >= MAX_ATTEMPTS) {
        startCooldown(DEFAULT_COOLDOWN);
        setFailCount(0);
        showModal('warning', '로그인 제한', `${DEFAULT_COOLDOWN}초 후 재시도 가능해요.`);
      } else {
        showModal('error', '로그인 실패', `이메일/비밀번호를 확인해주세요. (${next}/${MAX_ATTEMPTS})`);
      }
    } catch {
      showModal('error', '오류', '로그인 처리 중 문제가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }, [email, password, remember, submitting, cooldownUntil, login, navigate, redirect, startCooldown]);

  const disabled = submitting || cooldownUntil > 0;

  return (
    <main className="airbng-login">
      <Header />
      <div className="page-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">로그인/회원가입</h1>
            <p className="login-subtitle">AirBnG에 오신 것을 환영합니다</p>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <div className="input-group">
              <label htmlFor="email" className="input-label">아이디(이메일)</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">비밀번호</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="login-options">
              <label className="checkbox">
                {/* 활성화 + 상태 바인딩 */}
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>자동 로그인</span>
              </label>
              <button
                type="button"
                className="link-button"
                onClick={() => navigate('/page/home')}
              >
                아이디/비밀번호 찾기
              </button>
            </div>

            <button type="submit" className={`login-button ${disabled ? 'disabled': ''}`} disabled={disabled}>
              {cooldownUntil ? `${countdown}초 후 시도해주세요` : (submitting ? '로그인 중...' : '로그인')}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">또는</span>
            <div className="divider-line" />
          </div>

          <div className="signup-section">
            <p className="signup-text">
              아직 계정이 없으신가요?{' '}
              <button
                className="signup-link"
                onClick={() => navigate(`/page/signup?redirect=${encodeURIComponent(redirect)}`)}
              >
                회원가입
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* 모달 */}
      {modal.open && (
        <div className="login-modal-overlay" onClick={closeModal}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <div className="login-modal-header">
              <h3>{modal.title}</h3>
            </div>
            <div className={`login-modal-body ${modal.type}`}>
              <p>{modal.message}</p>
            </div>
            <div className="login-modal-footer">
              <button
                className="login-modal-button"
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  else closeModal();
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
