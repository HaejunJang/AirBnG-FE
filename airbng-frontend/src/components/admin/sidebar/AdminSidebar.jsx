import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SlArrowLeft, SlArrowRight } from "react-icons/sl";
import { GoChecklist } from "react-icons/go";
import { FiTrendingUp } from "react-icons/fi";
import { CiCalendar } from "react-icons/ci";
import { LuBuilding } from "react-icons/lu";
import { BiMoneyWithdraw } from "react-icons/bi";
import styles from '../../../styles/admin/layout/AdminSidebar.module.css';

const AdminSidebar = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeMenu, setActiveMenu] = useState('보관소 심사');
    const [activeSubMenu, setActiveSubMenu] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

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

    // URL 기반으로 활성 메뉴 설정
    useEffect(() => {
        const currentPath = location.pathname;

        if (currentPath.includes('/admin/storage-review')) {
            setActiveMenu('보관소 심사');
            setActiveSubMenu('');
        } else if (currentPath.includes('/admin/sales')) {
            setActiveMenu('매출');
            // 서브메뉴 설정
            if (currentPath.includes('/admin/sales/period')) {
                setActiveSubMenu('기간별매출');
            } else if (currentPath.includes('/admin/sales/storage')) {
                setActiveSubMenu('보관소별 매출');
            } else if (currentPath.includes('/admin/sales/net')) {
                setActiveSubMenu('순매출');
            } else {
                setActiveSubMenu('');
            }
        }
    }, [location.pathname]);

    const handleMenuClick = (item) => {
        setActiveMenu(item.name);

        if (item.subItems.length === 0) {
            setActiveSubMenu('');
            navigate(item.path);
        } else {
            setActiveSubMenu('');
            // 매출 메뉴의 경우 개요 페이지로 이동
            navigate('/admin/sales');
        }
    };

    const handleSubMenuClick = (subItem) => {
        setActiveSubMenu(subItem.name);
        navigate(subItem.path);
    };

    return (
        <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
            {/* 헤더 */}
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
    );
};

export default AdminSidebar;