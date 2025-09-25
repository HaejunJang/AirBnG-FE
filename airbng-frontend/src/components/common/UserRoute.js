import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

function UserRoute({ children }) {
    const { isLoggedIn, isAdmin, logout } = useAuth();
    const location = useLocation();

    useEffect(() => {
        // 로그인된 상태이고 어드민 권한이 있으면 자동 로그아웃
        if (isLoggedIn && isAdmin()) {
            console.log('어드민 사용자가 일반 사용자 페이지에 접근하여 자동 로그아웃됩니다.');
            logout().then(() => {
                // 로그아웃 후 홈페이지로 리다이렉트
                window.location.href = '/page/home';
            });
        }
    }, [isLoggedIn, isAdmin, logout, location]);

    return children;
}

export default UserRoute;