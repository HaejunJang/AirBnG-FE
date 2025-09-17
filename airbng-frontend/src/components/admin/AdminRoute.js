import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import styles from '../../styles/admin/AdminRoute.module.css';
import AdminLayout from "./AdminLayout";

function AdminRoute({ children, excludeLayout = false }) {
    const { isLoggedIn, isAdmin, ready } = useAuth();
    const location = useLocation();

    if (!ready) {
        return <div className={styles.loading}>로딩 중...</div>;
    }

    if (!isLoggedIn) {
        return <Navigate
            to={`/admin/login?redirect=${encodeURIComponent(location.pathname)}`}
            replace
        />;
    }

    if (!isAdmin()) {
        return (
            <div className={styles.unauthorized}>
                <h2>접근 권한이 없습니다</h2>
                <p>관리자만 접근할 수 있는 페이지입니다.</p>
                <button
                    className={styles.authButton}
                    onClick={() => window.location.href = '/admin/login'}
                >
                    관리자 로그인
                </button>
            </div>
        );
    }

    // excludeLayout이 true면 레이아웃 없이 children만 반환
    if (excludeLayout) {
        return children;
    }

    return (
        <AdminLayout>
            {children}
        </AdminLayout>
    );
}

export default AdminRoute;