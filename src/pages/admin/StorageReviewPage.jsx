import React from 'react';
import styles from '../../styles/admin/pages/AdminDashboard.module.css';

const StorageReviewPage = () => {
    return (
        <div className={styles.contentCard}>
            <h2 className={styles.contentTitle}>보관소 심사</h2>
            <div className={styles.textGray}>
                <p>보관소 승인 및 심사 관리 페이지입니다.</p>
                <p>메뉴를 클릭하면 해당 페이지로 이동합니다.</p>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <h3 className={styles.statLabel}>대기중</h3>
                        <p className={`${styles.statValue} ${styles.textOrange}`}>12</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3 className={styles.statLabel}>승인됨</h3>
                        <p className={`${styles.statValue} ${styles.textGreen}`}>45</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3 className={styles.statLabel}>반려됨</h3>
                        <p className={`${styles.statValue} ${styles.textRed}`}>3</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StorageReviewPage;