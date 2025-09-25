import React, { useEffect } from 'react';
import styles from '../styles/pages/SplashScreen.module.css';
import logo from '../assets/logo_name_ic.svg';

const SplashScreen = ({ onNavigateToHome }) => {
    useEffect(() => {
        // 2초 후 자동 이동
        const timer = setTimeout(() => {
            if (onNavigateToHome) {
                onNavigateToHome();
            } else {
                // fallback: window.location 사용
                window.location.href = '/page/home';
            }
        }, 2000);

        // 클릭, 키보드, 터치 이벤트 리스너
        const handleInteraction = () => {
            if (onNavigateToHome) {
                onNavigateToHome();
            } else {
                // fallback: window.location 사용
                window.location.href = '/page/home';
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (onNavigateToHome) {
                    onNavigateToHome();
                } else {
                    // fallback: window.location 사용
                    window.location.href = '/page/home';
                }
            }
        };

        // 이벤트 리스너 등록
        document.addEventListener('click', handleInteraction);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('touchstart', handleInteraction);

        // 컴포넌트 언마운트 시 정리
        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('touchstart', handleInteraction);
        };
    }, [onNavigateToHome]);

    return (
        <div className={styles.container}>
            <div className={styles.splashWrapper}>
                <div className={styles.mainContent}>
                    <div className={styles.splashContent}>
                        <div className={styles.logoSection}>
                            <div className={styles.logoContainer}>
                                <img
                                    src={logo}
                                    alt="에어비앤짐 로고"
                                    className={styles.logoName}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;