import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Modal, useModal } from '../../components/common/ModalUtil'; // ModalUtil import
import styles from '../../styles/admin/pages/AdminLoginPage.module.css';

const COOLDOWN_KEY = 'adminLoginCooldownUntil';
const FAIL_COUNT_KEY = 'adminLoginFailCount';
const MAX_ATTEMPTS = 5;
const DEFAULT_COOLDOWN = 30;

const cdKeyFor = (email) => `${COOLDOWN_KEY}:${(email || '').toLowerCase().trim()}`;

export default function AdminLoginPage() {
    const { adminLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // ModalUtil 훅 사용
    const {
        modalState,
        hideModal,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    } = useModal();

    const redirect = useMemo(() => {
        const sp = new URLSearchParams(location.search);
        return sp.get('redirect') || '/admin/home';
    }, [location.search]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [cooldownUntil, setCooldownUntil] = useState(0);
    const [countdown, setCountdown] = useState(0);

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
            showError('로그인 실패', '이메일/비밀번호를 확인해주세요.');
            return;
        }

        try {
            setSubmitting(true);
            const r = await adminLogin({ email, password });

            if (r?.ok) {
                resetFailCount();
                showSuccess('로그인 성공', '관리자로 로그인되었습니다.', () => {
                    navigate(redirect, { replace: true });
                });
                return;
            }

            if (r?.status === 429 || r?.code === 8003) {
                const sec = Number(r?.retryAfter || DEFAULT_COOLDOWN);
                startCooldown(sec);
                showWarning('요청이 너무 많습니다', `${sec}초 후 다시 시도해주세요.`);
                return;
            }

            const next = getFailCount() + 1;
            setFailCount(next);
            if (next >= MAX_ATTEMPTS) {
                startCooldown(DEFAULT_COOLDOWN);
                setFailCount(0);
                showWarning('로그인 제한', `${DEFAULT_COOLDOWN}초 후 재시도 가능해요.`);
            } else {
                showError('로그인 실패', `이메일/비밀번호를 확인해주세요. (${next}/${MAX_ATTEMPTS})`);
            }
        } catch {
            showError('오류', '로그인 처리 중 문제가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setSubmitting(false);
        }
    }, [email, password, submitting, cooldownUntil, adminLogin, navigate, redirect, startCooldown, showSuccess, showError, showWarning]);

    const disabled = submitting || cooldownUntil > 0;

    return (
        <main className={styles.adminLogin}>
            <div className={styles.pageContainer}>
                <div className={styles.loginCard}>
                    <div className={styles.loginHeader}>
                        <h1 className={styles.loginTitle}>관리자 로그인</h1>
                    </div>

                    <form className={styles.loginForm} onSubmit={onSubmit}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="admin-email" className={styles.inputLabel}>이메일</label>
                            <input
                                id="admin-email"
                                type="email"
                                className={styles.formInput}
                                placeholder="이메일을 입력해주세요"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="admin-password" className={styles.inputLabel}>비밀번호</label>
                            <input
                                id="admin-password"
                                type="password"
                                className={styles.formInput}
                                placeholder="비밀번호를 입력해주세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={`${styles.loginButton} ${disabled ? styles.disabled : ''}`}
                            disabled={disabled}
                        >
                            {cooldownUntil ? `${countdown}초 후 시도해주세요` : (submitting ? '로그인 중...' : '로그인')}
                        </button>
                    </form>
                </div>
            </div>

            {/* ModalUtil 컴포넌트 사용 */}
            <Modal
                show={modalState.show}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                showCancel={modalState.showCancel}
                onConfirm={modalState.onConfirm}
                onCancel={modalState.onCancel}
                onClose={hideModal}
            />
        </main>
    );
}