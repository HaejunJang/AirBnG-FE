import React, { useState } from 'react';
import Header from '../admin/header/AdminHeader';
import AdminSidebar from '../admin/sidebar/AdminSidebar';
import styles from '../../styles/admin/layout/AdminLayout.module.css';

const AdminLayout = ({ children, title = 'AirBnG' }) => {
    const [activeMenu, setActiveMenu] = useState('보관소 심사');
    const [activeSubMenu, setActiveSubMenu] = useState('');

    return (
        <div className={styles.pageContainer}>
            <Header title={title} />

            <div className={styles.container}>
                <AdminSidebar
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    activeSubMenu={activeSubMenu}
                    setActiveSubMenu={setActiveSubMenu}
                />

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