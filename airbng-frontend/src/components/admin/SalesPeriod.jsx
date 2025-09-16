import React, { useState } from 'react';
import styles from '../../styles/admin/pages/SalesPeriodPage.module.css';
import SalesChart from "./chart/SalesChart";

const SalesPeriod = () => {
    const [activeTab, setActiveTab] = useState('daily');

    // 샘플 데이터
    const salesData = {
        daily: [
            { time: '3', amount: '89,500원', region: '부산', paymentMethod: '현금' },
            { time: '6', amount: '156,800원', region: '대구', paymentMethod: '카드' },
            { time: '9', amount: '75,200원', region: '인천', paymentMethod: '계좌이체' },
            { time: '12', amount: '198,300원', region: '광주', paymentMethod: '카드' },
            { time: '15', amount: '133,300원', region: '대전', paymentMethod: '카드' },
            { time: '18', amount: '177,300원', region: '세종', paymentMethod: '현금' },
            { time: '21', amount: '150,300원', region: '강원도', paymentMethod: '이체' },
            { time: '24', amount: '125,000원', region: '서울', paymentMethod: '카드' },
        ],
        monthly: [
            { time: '1', amount: '15,250,000원', region: '전국', paymentMethod: '종합' },
            { time: '2', amount: '12,890,000원', region: '전국', paymentMethod: '종합' },
            { time: '3', amount: '18,560,000원', region: '전국', paymentMethod: '종합' },
            { time: '4', amount: '14,750,000원', region: '전국', paymentMethod: '종합' },
            { time: '5', amount: '15,750,000원', region: '전국', paymentMethod: '종합' },
            { time: '6', amount: '14,660,000원', region: '전국', paymentMethod: '종합' },
            { time: '7', amount: '13,350,000원', region: '전국', paymentMethod: '종합' },
            { time: '8', amount: '15,700,000원', region: '전국', paymentMethod: '종합' },
            { time: '9', amount: '17,750,000원', region: '전국', paymentMethod: '종합' },
            { time: '10', amount: '14,880,000원', region: '전국', paymentMethod: '종합' },
            { time: '11', amount: '20,790,000원', region: '전국', paymentMethod: '종합' },
            { time: '12', amount: '14,750,000원', region: '전국', paymentMethod: '종합' },
        ],
        yearly: [
            { time: '2025', amount: '28,140,000원', region: '전국', paymentMethod: '종합' },
            { time: '2024', amount: '184,560,000원', region: '전국', paymentMethod: '종합' },
            { time: '2023', amount: '156,780,000원', region: '전국', paymentMethod: '종합' },
        ]
    };

    const getCurrentData = () => {
        return salesData[activeTab] || [];
    };

    return (
        <div className={styles.container}>
            {/* 메인 컨텐츠 */}
            <div className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>기간별 매출 관리</h1>
                </div>

                <div className={styles.content}>
                    {/* 탭 버튼들 */}
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'daily' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('daily')}
                        >
                            일간
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'monthly' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('monthly')}
                        >
                            월간
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'yearly' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('yearly')}
                        >
                            연간
                        </button>
                    </div>

                    <SalesChart
                        data={salesData[activeTab]}
                        activeTab={activeTab}
                    />

                    {/* 매출 목록 */}
                    <div className={styles.listSection}>
                        <h3 className={styles.sectionTitle}>
                            {activeTab === 'daily' && '일간 매출 내역'}
                            {activeTab === 'monthly' && '월간 매출 내역'}
                            {activeTab === 'yearly' && '연간 매출 내역'}
                        </h3>

                        <div className={styles.listContainer}>
                            <div className={styles.listHeader}>
                                <div className={styles.headerCell}>시간/기간</div>
                                <div className={styles.headerCell}>금액</div>
                                <div className={styles.headerCell}>지역</div>
                                <div className={styles.headerCell}>결제방법</div>
                                <div className={styles.headerCell}>상태</div>
                            </div>

                            {getCurrentData().map((item, index) => (
                                <div key={index} className={styles.listRow}>
                                    <div className={styles.cell}>{item.time}</div>
                                    <div className={styles.cell}>{item.amount}</div>
                                    <div className={styles.cell}>{item.region}</div>
                                    <div className={styles.cell}>{item.paymentMethod}</div>
                                    <div className={styles.cell}>
                                        <div className={styles.statusButtons}>
                                            <button className={styles.btnSuccess}>완료</button>
                                            <button className={styles.btnInfo}>상세</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 페이지네이션 */}
                        <div className={styles.pagination}>
                            <span className={styles.pageNumber}>1</span>
                            <span className={styles.pageNumber}>2</span>
                            <span className={styles.pageNumber}>3</span>
                            <span className={styles.pageNumber}>...</span>
                            <span className={styles.pageNumber}>9</span>
                            <span className={styles.pageNumber}>10</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesPeriod;