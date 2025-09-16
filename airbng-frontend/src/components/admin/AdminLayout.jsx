import React from 'react';
import Header from '../admin/header/AdminHeader';
import AdminSidebar from '../admin/sidebar/AdminSidebar';
import styles from '../../styles/admin/layout/AdminLayout.module.css';

const AdminLayout = ({ children, title = 'AirBnG' }) => {
    return (
        <div className={styles.pageContainer}>
            {/* 상단 헤더 */}
            <Header title={title} />

            <div className={styles.container}>
                {/* 사이드바 - 이제 내부에서 상태 관리 */}
                <AdminSidebar />

                {/* 메인 컨텐츠 */}
                <div className={styles.mainContent}>
                    <div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;