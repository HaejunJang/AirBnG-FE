import React from 'react';
import styles from '../../styles/admin/pages/AdminDashboard.module.css';
import StorageReviewContent from "../../pages/admin/LockerReviewPage";

const AdminDashboard = ({ activeMenu, activeSubMenu }) => {
    const renderContent = () => {
        if (activeMenu === '보관소 심사') {
            return (
                <StorageReviewContent />

            );
        }

        if (activeMenu === '매출' && !activeSubMenu) {
            const menuItems = [
                {
                    name: '기간별매출',
                    icon: '📅',
                    desc: '기간별 매출 현황을 확인하세요'
                },
                {
                    name: '보관소별 매출',
                    icon: '🏢',
                    desc: '각 보관소의 매출을 비교하세요'
                }
            ];

            return (
                <div className={styles.contentCard}>
                    <h2 className={styles.contentTitle}>매출 관리</h2>
                    <div className={styles.textGray}>
                        <p>매출 관련 메뉴를 선택해주세요.</p>
                        <div className={styles.menuGrid}>
                            {menuItems.map((item, index) => (
                                <div key={index} className={styles.menuCard}>
                                    <div className={styles.menuCardIcon}>{item.icon}</div>
                                    <h3 className={styles.menuCardTitle}>{item.name}</h3>
                                    <p className={styles.menuCardDesc}>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // 기본 대시보드 화면
        return (
            <div className={styles.contentCard}>
                <h2 className={styles.contentTitle}>관리자 대시보드</h2>
                <div className={styles.textGray}>
                    <p>원하는 메뉴를 선택해주세요.</p>
                </div>
            </div>
        );
    };

    return renderContent();
};

export default AdminDashboard;