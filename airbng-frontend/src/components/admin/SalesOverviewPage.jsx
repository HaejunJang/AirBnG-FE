import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CiCalendar } from "react-icons/ci";
import { LuBuilding } from "react-icons/lu";
import { BiMoneyWithdraw } from "react-icons/bi";
import styles from '../../styles/admin/pages/AdminDashboard.module.css';

const SalesOverviewPage = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            name: '기간별매출',
            icon: <CiCalendar size={18} />,
            path: '/admin/sales/period',
            description: '기간별 매출 현황을 확인하세요'
        },
        {
            name: '보관소별 매출',
            icon: <LuBuilding size={18} />,
            path: '/admin/sales/storage',
            description: '각 보관소의 매출을 비교하세요'
        },
        {
            name: '순매출',
            icon: <BiMoneyWithdraw size={18} />,
            path: '/admin/sales/net',
            description: '순매출 및 수익률을 분석하세요'
        }
    ];

    const handleMenuClick = (item) => {
        navigate(item.path);
    };

    return (
        <div className={styles.contentCard}>
            <h2 className={styles.contentTitle}>매출 관리</h2>
            <div className={styles.textGray}>
                <p>매출 관련 메뉴를 선택해주세요.</p>
                <div className={styles.menuGrid}>
                    {menuItems.map((item, index) => (
                        <div key={index} className={styles.menuCard} onClick={() => handleMenuClick(item)}>
                            <div className={styles.menuCardIcon}>{item.icon}</div>
                            <h3 className={styles.menuCardTitle}>{item.name}</h3>
                            <p className={styles.menuCardDesc}>{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SalesOverviewPage;