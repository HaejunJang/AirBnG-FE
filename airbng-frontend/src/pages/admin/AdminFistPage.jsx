import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileCheck, TrendingUp, Calendar, Building, DollarSign } from 'lucide-react';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeMenu, setActiveMenu] = useState('매출');
    const [activeSubMenu, setActiveSubMenu] = useState('기간별매출');

    const menuItems = [
        {
            name: '보관소 심사',
            icon: <FileCheck size={20} />,
            subItems: []
        },
        {
            name: '매출',
            icon: <TrendingUp size={20} />,
            subItems: [
                { name: '기간별매출', icon: <Calendar size={18} /> },
                { name: '보관소별 매출', icon: <Building size={18} /> },
                { name: '순매출', icon: <DollarSign size={18} /> }
            ]
        }
    ];

    const renderContent = () => {
        if (activeMenu === '보관소 심사') {
            return (
                <div className={styles.contentCard}>
                    <h2 className={styles.contentTitle}>보관소 심사</h2>
                    <div className={styles.textGray}>
                        <p>보관소 승인 및 심사 관리 페이지입니다.</p>
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
        }

        const renderSalesContent = () => {
            switch (activeSubMenu) {
                case '기간별매출':
                    return (
                        <div>
                            <h3 className={styles.subTitle}>기간별 매출 현황</h3>
                            <div className={styles.salesGrid}>
                                <div className={styles.salesCard}>
                                    <h4 className={styles.salesLabel}>오늘</h4>
                                    <p className={styles.salesValue}>₩2,450,000</p>
                                </div>
                                <div className={styles.salesCard}>
                                    <h4 className={styles.salesLabel}>이번주</h4>
                                    <p className={styles.salesValue}>₩15,200,000</p>
                                </div>
                                <div className={styles.salesCard}>
                                    <h4 className={styles.salesLabel}>이번달</h4>
                                    <p className={styles.salesValue}>₩68,750,000</p>
                                </div>
                                <div className={styles.salesCard}>
                                    <h4 className={styles.salesLabel}>올해</h4>
                                    <p className={styles.salesValue}>₩425,600,000</p>
                                </div>
                            </div>
                        </div>
                    );
                case '보관소별 매출':
                    return (
                        <div>
                            <h3 className={styles.subTitle}>보관소별 매출 현황</h3>
                            <div className={styles.storageList}>
                                <div className={styles.storageItems}>
                                    {[
                                        { name: '강남 보관소', sales: '₩12,450,000', growth: '+15%' },
                                        { name: '홍대 보관소', sales: '₩8,920,000', growth: '+8%' },
                                        { name: '잠실 보관소', sales: '₩11,230,000', growth: '+22%' },
                                        { name: '신촌 보관소', sales: '₩6,780,000', growth: '-3%' },
                                    ].map((item, index) => (
                                        <div key={index} className={styles.storageItem}>
                                            <span className={styles.storageName}>{item.name}</span>
                                            <div className={styles.storageInfo}>
                                                <span className={styles.storageSales}>{item.sales}</span>
                                                <span className={`${styles.growthBadge} ${
                                                    item.growth.startsWith('+')
                                                        ? styles.growthPositive
                                                        : styles.growthNegative
                                                }`}>
                          {item.growth}
                        </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                case '순매출':
                    return (
                        <div>
                            <h3 className={styles.subTitle}>순매출 분석</h3>
                            <div className={styles.profitGrid}>
                                <div className={styles.profitCard}>
                                    <h4 className={styles.profitTitle}>수익 구조</h4>
                                    <div className={styles.profitItems}>
                                        <div className={styles.profitItem}>
                                            <span className={styles.profitLabel}>총 매출</span>
                                            <span className={styles.profitValue}>₩68,750,000</span>
                                        </div>
                                        <div className={styles.profitItem}>
                                            <span className={styles.profitLabel}>운영비용</span>
                                            <span className={`${styles.profitValue} ${styles.textRed}`}>-₩15,200,000</span>
                                        </div>
                                        <div className={styles.profitItem}>
                                            <span className={styles.profitLabel}>수수료</span>
                                            <span className={`${styles.profitValue} ${styles.textRed}`}>-₩6,875,000</span>
                                        </div>
                                        <hr className={styles.divider} />
                                        <div className={styles.profitItem}>
                                            <span className={styles.profitLabelBold}>순매출</span>
                                            <span className={`${styles.profitValueBold} ${styles.textGreen}`}>₩46,675,000</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.profitCard}>
                                    <h4 className={styles.profitTitle}>수익률</h4>
                                    <div className={styles.profitRateContainer}>
                                        <div className={styles.profitRate}>67.9%</div>
                                        <div className={styles.profitRateLabel}>이번 달 순수익률</div>
                                        <div className={styles.profitGrowth}>
                                            지난달 대비 +4.2% 상승
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                default:
                    return null;
            }
        };

        return (
            <div className={styles.contentCard}>
                <h2 className={styles.contentTitle}>매출 관리</h2>
                {renderSalesContent()}
            </div>
        );
    };

    return (
        <div className={styles.container}>
            {/* 사이드바 */}
            <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
                {/* 헤더 */}
                <div className={styles.sidebarHeader}>
                    {sidebarOpen && <h1 className={styles.sidebarTitle}>Admin</h1>}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={styles.toggleButton}
                    >
                        {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>

                {/* 메뉴 */}
                <nav className={styles.nav}>
                    {menuItems.map((item) => (
                        <div key={item.name} className={styles.menuItem}>
                            <button
                                onClick={() => {
                                    setActiveMenu(item.name);
                                    if (item.subItems.length === 0) {
                                        setActiveSubMenu('');
                                    } else if (item.name === '매출' && !item.subItems.some(sub => sub.name === activeSubMenu)) {
                                        setActiveSubMenu(item.subItems[0].name);
                                    }
                                }}
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
                                            onClick={() => {
                                                setActiveSubMenu(subItem.name);
                                            }}
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
    );
};

export default AdminDashboard;