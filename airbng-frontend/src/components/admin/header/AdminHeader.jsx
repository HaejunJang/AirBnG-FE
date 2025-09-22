import React from 'react';
import styles from '../../../styles/admin/layout/AdminHeader.module.css';

const Header = ({ title = 'AirBnG' }) => {
    return (
        <div className={styles.topHeader}>
            <div className={styles.headerContent}>
                <h1 className={styles.headerTitle}>{title}</h1>
            </div>
        </div>
    );
};

export default Header;