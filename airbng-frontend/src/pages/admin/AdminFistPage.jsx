import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlArrowLeft, SlArrowRight } from "react-icons/sl";
import { GoChecklist } from "react-icons/go";
import { FiTrendingUp } from "react-icons/fi";
import { CiCalendar } from "react-icons/ci";
import { LuBuilding } from "react-icons/lu";
import { BiMoneyWithdraw } from "react-icons/bi";
import StorageReviewContent from './LockerReviewPage';
import styles from '../../styles/admin/pages/adminfirstpage.module.css';

const AdminDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeMenu, setActiveMenu] = useState('보관소 심사');
    const [activeSubMenu, setActiveSubMenu] = useState('');
    const navigate = useNavigate();

    const menuItems = [
        {
            name: '보관소 심사',
            icon: <GoChecklist size={20} />,
            subItems: [],
            path: '/admin/storage-review'
        },
        {
            name: '매출',
            icon: <FiTrendingUp size={20} />,
            subItems: [
                {
                    name: '기간별매출',
                    icon: <CiCalendar size={18} />,
                    path: '/admin/sales/period'
                },
                {
                    name: '보관소별 매출',
                    icon: <LuBuilding size={18} />,
                    path: '/admin/sales/storage'
                },
                {
                    name: '순매출',
                    icon: <BiMoneyWithdraw size={18} />,
                    path: '/admin/sales/net'
                }
            ]
        }
    ];

    const handleMenuClick = (item) => {
        setActiveMenu(item.name);
        if (item.subItems.length === 0) {
            setActiveSubMenu('');
            if (item.name === '보관소 심사') {
                // 보관소 심사 메뉴는 현재 페이지에서 처리
            }
        } else {
            setActiveSubMenu('');
        }
    };

    const handleSubMenuClick = (subItem) => {
        setActiveSubMenu(subItem.name);
        navigate(subItem.path);
    };

    const renderContent = () => {
        if (activeMenu === '보관소 심사') {
            return <StorageReviewContent />;
        }

        if (activeMenu === '매출' && !activeSubMenu) {
            return (
                <div className={styles.contentCard}>
                    <h2 className={styles.contentTitle}>매출 관리</h2>
                    <div className={styles.textGray}>
                        <p>매출 관련 메뉴를 선택해주세요.</p>
                        <div className={styles.menuGrid}>
                            {menuItems.find(item => item.name === '매출')?.subItems.map((subItem, index) => (
                                <div
                                    key={index}
                                    className={styles.menuCard}
                                    onClick={() => handleSubMenuClick(subItem)}
                                >
                                    <div className={styles.menuCardIcon}>{subItem.icon}</div>
                                    <h3 className={styles.menuCardTitle}>{subItem.name}</h3>
                                    <p className={styles.menuCardDesc}>
                                        {subItem.name === '기간별매출' && '기간별 매출 현황을 확인하세요'}
                                        {subItem.name === '보관소별 매출' && '각 보관소의 매출을 비교하세요'}
                                        {subItem.name === '순매출' && '순매출 및 수익률을 분석하세요'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.contentCard}>
                <h2 className={styles.contentTitle}>관리자 대시보드</h2>
                <div className={styles.textGray}>
                    <p>원하는 메뉴를 선택해주세요.</p>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.pageContainer}>
            {/* 상단 헤더 */}
            <div className={styles.topHeader}>
                <div className={styles.headerContent}>
                    <h1 className={styles.headerTitle}>AirBnG</h1>
                </div>
            </div>

            <div className={styles.container}>
                {/* 사이드바 */}
                <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
                    <div className={styles.sidebarHeader}>
                        {sidebarOpen && <h1 className={styles.sidebarTitle}>Admin</h1>}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={styles.toggleButton}
                        >
                            {sidebarOpen ? <SlArrowLeft size={20} /> : <SlArrowRight size={20} />}
                        </button>
                    </div>

                    {/* 메뉴 */}
                    <nav className={styles.nav}>
                        {menuItems.map((item) => (
                            <div key={item.name} className={styles.menuItem}>
                                <button
                                    onClick={() => handleMenuClick(item)}
                                    className={`${styles.menuButton} ${
                                        activeMenu === item.name ? styles.menuButtonActive : ''
                                    }`}
                                >
                                    <span className={styles.menuIcon}>{item.icon}</span>
                                    {sidebarOpen && <span className={styles.menuText}>{item.name}</span>}
                                </button>

                                {/* 서브메뉴 */}
                                {sidebarOpen && activeMenu === item.name && item.subItems.length > 0 && (
                                    <div className={styles.subMenu}>
                                        {item.subItems.map((subItem) => (
                                            <button
                                                key={subItem.name}
                                                onClick={() => handleSubMenuClick(subItem)}
                                                className={`${styles.subMenuButton} ${
                                                    activeSubMenu === subItem.name ? styles.subMenuButtonActive : ''
                                                }`}
                                            >
                                                <span className={styles.subMenuIcon}>{subItem.icon}</span>
                                                <span className={styles.subMenuText}>{subItem.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* 메인 컨텐츠 */}
                <div className={styles.mainContent}>
                    <div className={styles.contentWrapper}>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;