import React, { useState } from 'react';
import styles from '../../styles/admin/pages/PeriodSalesPage.module.css';
import PeriodSalesChart from "./chart/PeriodSalesChart";

const PeriodSales = () => {
    const [activeTab, setActiveTab] = useState('daily');

    // 샘플 데이터
    const salesData = {
        daily: [
            { time: '25/01/05', amount: '89,500원', fee: '300', refund: '89,500원', paymentMethod: '짐페이' },
            { time: '25/01/05', amount: '156,800원', fee: '300', refund: '', paymentMethod: '짐페이' },
            { time: '25/01/04', amount: '75,200원', fee: '500', refund: '', paymentMethod: '짐페이' },
            { time: '25/01/03', amount: '198,300원', fee: '1300', refund: '', paymentMethod: '짐페이' },
            { time: '25/01/03', amount: '133,300원', fee: '200', refund: '133,300원', paymentMethod: '짐페이' },
            { time: '25/01/03', amount: '177,300원', fee: '500', refund: '', paymentMethod: '짐페이' },
            { time: '25/01/02', amount: '150,300원', fee: '1000', refund: '', paymentMethod: '짐페이' },
            { time: '25/01/01', amount: '125,000원', fee: '1000', refund: '125,000원', paymentMethod: '짐페이' },
        ]
        // monthly: [
        //     { time: '1', amount: '15,250,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '2', amount: '12,890,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '3', amount: '18,560,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '4', amount: '14,750,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '5', amount: '15,750,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '6', amount: '14,660,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '7', amount: '13,350,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '8', amount: '15,700,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '9', amount: '17,750,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '10', amount: '14,880,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '11', amount: '20,790,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '12', amount: '14,750,000원', region: '전국', paymentMethod: '종합' },
        // ],
        // yearly: [
        //     { time: '2025', amount: '28,140,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '2024', amount: '184,560,000원', region: '전국', paymentMethod: '종합' },
        //     { time: '2023', amount: '156,780,000원', region: '전국', paymentMethod: '종합' },
        // ]
    };

    const getCurrentData = () => {
        return salesData.daily;
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
                            주간
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

                    <PeriodSalesChart
                        data={salesData[activeTab]}
                        activeTab={activeTab}
                    />

                    {/* 매출 목록 */}
                    <div className={styles.listSection}>
                        <h3 className={styles.sectionTitle}>
                            {activeTab === 'daily' && '최근 거래 내역'}
                            {activeTab === 'monthly' && '최근 거래 내역'}
                            {activeTab === 'yearly' && '최근 거래 내역'}
                        </h3>

                        <div className={styles.tableContainer}>
                            <div className={styles.tableHeader}>
                                <div className={styles.headerCell}>날짜</div>
                                <div className={styles.headerCell}>금액</div>
                                <div className={styles.headerCell}>환불금액</div>
                                <div className={styles.headerCell}>수수료</div>
                                {/*<div className={styles.headerCell}>지역</div>*/}
                                <div className={styles.headerCell}>결제수단</div>
                                <div className={styles.headerCell}>결제상태</div>
                            </div>

                            {getCurrentData().map((item, index) => (
                                <div key={index} className={styles.tableRow}>
                                    <div className={styles.cell}>{item.time}</div>
                                    <div className={styles.cell}>{item.amount}</div>
                                    <div className={styles.cell}>{item.refund}</div>
                                    <div className={styles.cell}>{item.fee}</div>
                                    <div className={styles.cell}>{item.paymentMethod}</div>
                                    <div className={styles.cell}>
                                        <div className={styles.actionButtons}>
                                            <button className={styles.btnDetail}>완료</button>
                                            {/*<button className={styles.btnReport}>환불</button>*/}
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

export default PeriodSales;