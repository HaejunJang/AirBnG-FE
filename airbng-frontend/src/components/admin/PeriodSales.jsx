import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/pages/PeriodSalesPage.module.css';
import PeriodSalesChart from "./chart/PeriodSalesChart";
import { usePeriodSales } from '../../hooks/usePeriodSales';

const PeriodSales = () => {
    const [activeTab, setActiveTab] = useState('daily');
    const { salesData, chartData, pagination, loading, error, fetchAllSalesData } = usePeriodSales();

    // 탭 변경 시 전체 데이터 가져오기
    const handleTabChange = async (tabType) => {
        setActiveTab(tabType);
        console.log('탭 변경:', tabType);
        // 전체 데이터를 가져옵니다 (날짜 범위 필터링 없이)
        await fetchAllSalesData();
    };

    // 페이지 변경 처리 (매출 목록용)
    const handlePageChange = async (newPage) => {
        console.log('페이지 변경:', newPage);
        // 전체 데이터에서 페이징만 변경
        await fetchAllSalesData(newPage);
    };

    // 페이지네이션 렌더링 함수
    const renderPagination = () => {
        const { currentPage, totalPages, hasNext, hasPrevious } = pagination;

        if (totalPages <= 1) return null;

        const pageNumbers = [];
        const maxVisiblePages = 10;

        // 시작 페이지와 끝 페이지 계산
        let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

        // 끝에서부터 계산하여 시작 페이지 재조정
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(0, endPage - maxVisiblePages + 1);
        }

        // 이전 버튼
        if (hasPrevious) {
            pageNumbers.push(
                <button
                    key="prev"
                    className={styles.pageButton}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={loading}
                >
                    이전
                </button>
            );
        }

        // 첫 페이지 (1)
        if (startPage > 0) {
            pageNumbers.push(
                <button
                    key={0}
                    className={`${styles.pageNumber} ${currentPage === 0 ? styles.active : ''}`}
                    onClick={() => handlePageChange(0)}
                    disabled={loading}
                >
                    1
                </button>
            );

            if (startPage > 1) {
                pageNumbers.push(<span key="start-ellipsis" className={styles.ellipsis}>...</span>);
            }
        }

        // 페이지 번호들
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <button
                    key={i}
                    className={`${styles.pageNumber} ${currentPage === i ? styles.active : ''}`}
                    onClick={() => handlePageChange(i)}
                    disabled={loading}
                >
                    {i + 1}
                </button>
            );
        }

        // 마지막 페이지
        if (endPage < totalPages - 1) {
            if (endPage < totalPages - 2) {
                pageNumbers.push(<span key="end-ellipsis" className={styles.ellipsis}>...</span>);
            }

            pageNumbers.push(
                <button
                    key={totalPages - 1}
                    className={`${styles.pageNumber} ${currentPage === totalPages - 1 ? styles.active : ''}`}
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={loading}
                >
                    {totalPages}
                </button>
            );
        }

        // 다음 버튼
        if (hasNext) {
            pageNumbers.push(
                <button
                    key="next"
                    className={styles.pageButton}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={loading}
                >
                    다음
                </button>
            );
        }

        return pageNumbers;
    };

    // 컴포넌트 마운트 시 초기 데이터 로드
    useEffect(() => {
        console.log('컴포넌트 마운트 - 전체 데이터 로드');
        fetchAllSalesData();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>기간별 매출 관리</h1>
                </div>

                <div className={styles.content}>
                    {/* 탭 버튼들 */}
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'daily' ? styles.tabActive : ''}`}
                            onClick={() => handleTabChange('daily')}
                            disabled={loading}
                        >
                            주간
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'monthly' ? styles.tabActive : ''}`}
                            onClick={() => handleTabChange('monthly')}
                            disabled={loading}
                        >
                            월간
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'yearly' ? styles.tabActive : ''}`}
                            onClick={() => handleTabChange('yearly')}
                            disabled={loading}
                        >
                            연간
                        </button>
                    </div>

                    {/* 로딩 상태 */}
                    {loading && (
                        <div className={styles.loadingContainer}>
                            <p>데이터를 불러오는 중...</p>
                        </div>
                    )}

                    {/* 에러 상태 */}
                    {error && (
                        <div className={styles.errorContainer}>
                            <p>데이터를 불러오는데 실패했습니다: {error}</p>
                            <button onClick={() => handleTabChange(activeTab)}>다시 시도</button>
                        </div>
                    )}

                    {/* 차트 */}
                    {!loading && !error && (
                        <PeriodSalesChart
                            data={chartData}
                            activeTab={activeTab}
                        />
                    )}

                    {/* 매출 목록 */}
                    <div className={styles.listSection}>
                        <h3 className={styles.sectionTitle}>
                            최근 거래 내역
                            {pagination.totalElements > 0 && (
                                <span className={styles.totalCount}>
                                    (총 {pagination.totalElements.toLocaleString()}건)
                                </span>
                            )}
                        </h3>

                        <div className={styles.tableContainer}>
                            <div className={styles.tableHeader}>
                                <div className={styles.headerCell}>날짜</div>
                                <div className={styles.headerCell}>금액</div>
                                <div className={styles.headerCell}>수수료</div>
                                <div className={styles.headerCell}>결제수단</div>
                                <div className={styles.headerCell}>결제상태</div>
                            </div>

                            {!loading && !error && salesData.length > 0 ? (
                                salesData.map((item, index) => (
                                    <div key={index} className={styles.tableRow}>
                                        <div className={styles.cell}>{item.time}</div>
                                        <div className={styles.cell}>{item.amount}</div>
                                        <div className={styles.cell}>{item.fee}</div>
                                        <div className={styles.cell}>{item.paymentMethod}</div>
                                        <div className={styles.cell}>
                                            <div className={styles.actionButtons}>
                                                <button className={styles.btnDetail}>완료</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : !loading && !error ? (
                                <div className={styles.noData}>
                                    <p>매출 데이터가 없습니다.</p>
                                </div>
                            ) : null}
                        </div>

                        {/* 페이지네이션 */}
                        {!loading && !error && pagination.totalPages > 1 && (
                            <div className={styles.pagination}>
                                {renderPagination()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PeriodSales;