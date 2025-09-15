import React, { useState } from 'react';
import Header from '../admin/header/AdminHeader';
import AdminSidebar from '../admin/sidebar/AdminSidebar';
import styles from '../../styles/admin/layout/AdminLayout.module.css';

const AdminLayout = ({ children, title = 'AirBnG' }) => {
    const [activeMenu, setActiveMenu] = useState('보관소 심사');
    const [activeSubMenu, setActiveSubMenu] = useState('');

    return (
        <div className={styles.pageContainer}>
            {/* 상단 헤더 */}
            <Header title={title} />

            <div className={styles.container}>
                {/* 사이드바 */}
                <AdminSidebar
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    activeSubMenu={activeSubMenu}
                    setActiveSubMenu={setActiveSubMenu}
                />

                {/* 메인 컨텐츠 */}
                <div className={styles.mainContent}>
                    <div className={styles.contentWrapper}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;