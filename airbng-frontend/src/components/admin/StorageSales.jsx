import React, { useState } from 'react';
import styles from '../../styles/admin/pages/StorageSalesPage.module.css';
import StorageSalesChart from './chart/StorageSalesChart';

const StorageSales = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('이번달');
    const [selectedRegion, setSelectedRegion] = useState('전체');
    const [sortBy, setSortBy] = useState('매출액');

    // 샘플 데이터
    const paymentData = [
        {
            id: 1,
            method: '개인 보관소',
            sales: '28,450,000원',
            transactions: 1458,
            avgAmount: '19,520원',
            fee: '112,890원',
            refund: '235,430원',
        },
        {
            id: 2,
            method: '공공기관 보관소',
            sales: '15,680,000원',
            transactions: 642,
            avgAmount: '24,440원',
            fee: '108,560원',
            refund: '127,430원'
        },
        {
            id: 3,
            method: '기업 보관소',
            sales: '680,000원',
            transactions: 520,
            avgAmount: '13,440원',
            fee: '95,240원',
            refund: '65,550원'
        }
    ];

    const summaryData = {
        totalSales: '54,430,000원',
        totalTransactions: 2652,
        avgTransaction: '20,530원',
        activePayments: 4
    };

    const chartData = paymentData.map(payment => ({
        name: payment.method,
        sales: parseInt(payment.sales.replace(/[^\d]/g, '')),
        transactions: payment.transactions,
        //sales: parseFloat(payment.percentage.replace('%', '')),
        avgAmount: parseInt(payment.avgAmount.replace(/[^\d]/g, ''))
    }));

    const handleSearch = () => {
        console.log('검색:', { selectedPeriod, selectedRegion, sortBy });
    };

    // const getGrowthClass = (growth) => {
    //     if (growth.startsWith('+')) return styles.growthPositive;
    //     if (growth.startsWith('-')) return styles.growthNegative;
    //     return styles.growthNeutral;
    // };

    return (
        <div className={styles.container}>
            <div className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>보관소별 매출 관리</h1>
                </div>

                <div className={styles.content}>
                    {/* 필터 섹션 */}
                    <div className={styles.filterSection}>
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>보관소</label>
                            <select
                                className={styles.select}
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                            >
                                <option value="개인">개인</option>
                                <option value="공공">공공기관</option>
                                <option value="기업">기업</option>
                            </select>
                        </div>
                        <button className={styles.searchButton} onClick={handleSearch}>
                            조회
                        </button>
                    </div>

                    {/* 요약 카드 */}
                    <div className={styles.summaryCards}>
                        <div className={styles.summaryCard}>
                            <div className={styles.cardTitle}>총 매출액</div>
                            <div className={styles.cardValue}>{summaryData.totalSales}</div>
                            <div className={styles.cardSubtext}>전월 대비 +12.8%</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.cardTitle}>총 거래수</div>
                            <div className={styles.cardValue}>{summaryData.totalTransactions}건</div>
                            <div className={styles.cardSubtext}>전월 대비 +9.5%</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.cardTitle}>평균 거래금액</div>
                            <div className={styles.cardValue}>{summaryData.avgTransaction}</div>
                            <div className={styles.cardSubtext}>전월 대비 +2.8%</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.cardTitle}>현재 보관소 수</div>
                            <div className={styles.cardValue}>{summaryData.activePayments}개</div>
                            {/*<div className={styles.cardSubtext}>총 5개 중</div>*/}
                        </div>
                    </div>

                    {/* 차트 섹션 */}
                    <div className={styles.chartSection}>
                        <StorageSalesChart data={chartData} />
                    </div>

                    {/* 보관소별 상세 목록 */}
                    <div className={styles.tableSection}>
                        <h3 className={styles.sectionTitle}>보관소별 상세 현황</h3>

                        <div className={styles.tableContainer}>
                            <div className={styles.tableHeader}>
                                <div className={styles.headerCell}>보관소 종류</div>
                                <div className={styles.headerCell}>매출액</div>
                                <div className={styles.headerCell}>거래수</div>
                                <div className={styles.headerCell}>평균 거래금액</div>
                                <div className={styles.headerCell}>환불액</div>
                                <div className={styles.headerCell}>수수료</div>
                                {/*<div className={styles.headerCell}>결제상태</div>*/}
                            </div>

                            {paymentData.map((payment) => (
                                <div key={payment.id} className={styles.tableRow}>
                                    <div className={styles.cell}>
                                        <div className={styles.paymentInfo}>
                                            <div className={styles.paymentMethod}>
                                                {payment.method}
                                                {/*<span className={`${styles.statusBadge} ${*/}
                                                {/*    payment.status === 'active' ? styles.statusActive : styles.statusInactive*/}
                                                {/*}`}>*/}
                                                {/*    {payment.status === 'active' ? '사용중' : '중지'}*/}
                                                {/*</span>*/}
                                            </div>
                                            {/*<div className={styles.paymentDetails}>*/}
                                            {/*    주요시간: {payment.popularTime} | 주요지역: {payment.topRegion}*/}
                                            {/*</div>*/}
                                        </div>
                                    </div>
                                    <div className={styles.cell}>{payment.sales}</div>
                                    <div className={styles.cell}>{payment.transactions}건</div>
                                    <div className={styles.cell}>{payment.avgAmount}</div>
                                    {/*<div className={styles.cell}>*/}
                                        {/*<div className={styles.percentageBar}>*/}
                                        {/*    <div*/}
                                        {/*        className={styles.percentageFill}*/}
                                        {/*        style={{width: payment.sales}}*/}
                                        {/*    ></div>*/}
                                        {/*    <span className={styles.percentageText}>{payment.sales}</span>*/}
                                        {/*</div>*/}
                                    {/*</div>*/}
                                    <div className={styles.cell}>{payment.fee}</div>
                                    <div className={styles.cell}>{payment.refund}</div>
                                    {/*<div className={styles.cell}>*/}
                                    {/*    <span className={getGrowthClass(payment.growth)}>*/}
                                    {/*        {payment.growth}*/}
                                    {/*    </span>*/}
                                    {/*</div>*/}
                                    {/*<div className={styles.cell}>*/}
                                    {/*    <div className={styles.actionButtons}>*/}
                                    {/*        <button className={styles.btnDetail}>상세</button>*/}
                                    {/*        <button className={styles.btnAnalysis}>분석</button>*/}
                                    {/*    </div>*/}
                                    {/*</div>*/}
                                </div>
                            ))}
                        </div>

                        {/* 페이지네이션 */}
                        {/*<div className={styles.pagination}>*/}
                        {/*    <span className={styles.pageNumber}>1</span>*/}
                        {/*    <span className={styles.pageNumber}>2</span>*/}
                        {/*    <span className={styles.pageNumber}>3</span>*/}
                        {/*    <span className={styles.pageNumber}>...</span>*/}
                        {/*    <span className={styles.pageNumber}>7</span>*/}
                        {/*    <span className={styles.pageNumber}>8</span>*/}
                        {/*</div>*/}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StorageSales;