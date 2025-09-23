import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/pages/StorageSalesPage.module.css';
import StorageSalesChart from './chart/StorageSalesChart';
import { useStorageSales } from '../../hooks/useStorageSales';

const StorageSales = () => {
    const [selectedLockerType, setSelectedLockerType] = useState('전체'); // 드롭다운 선택 상태
    const [searchLockerType, setSearchLockerType] = useState('전체'); // 실제 조회 시 사용

    const {
        storageSalesData,
        summaryData,
        periodData,
        loading,
        error,
        fetchStorageSales,
        fetchStorageSalesByPeriod
    } = useStorageSales();

    const getLockerTypeValue = (displayValue) => {
        switch (displayValue) {
            case '개인': return 'PERSONAL';
            case '공공기관': return 'PUBLIC';
            case '기업': return 'COMPANY';
            case '전체':
            default: return null;
        }
    };

    const getDateRange = () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const formatDate = (date) => date.toISOString().slice(0, 19);
        return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
    };

    const handleSearch = async () => {
        setSearchLockerType(selectedLockerType); // 조회용 상태 업데이트
        const lockerType = getLockerTypeValue(selectedLockerType);
        const { startDate, endDate } = getDateRange();

        if (lockerType === null) {
            await fetchStorageSales({ lockerType, startDate, endDate });
        } else {
            await fetchStorageSalesByPeriod({ lockerType, startDate, endDate });
        }
    };

    // 차트용 데이터
    const getChartData = () => {
        if (searchLockerType === '전체') {
            return storageSalesData.map(storage => ({
                name: storage.method,
                sales: parseInt(storage.sales.replace(/[^\d]/g, '')),
                transactions: storage.transactions,
                avgAmount: parseInt(storage.avgAmount.replace(/[^\d]/g, ''))
            }));
        } else {
            return periodData || [];
        }
    };

    const chartData = getChartData();
    const chartType = searchLockerType === '전체' ? 'pie' : 'composed';

    useEffect(() => {
        handleSearch();
    }, []);


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
                                value={selectedLockerType}
                                onChange={(e) => setSelectedLockerType(e.target.value)} // 상태만 변경
                                disabled={loading}
                            >
                                <option value="전체">전체</option>
                                <option value="개인">개인</option>
                                <option value="공공기관">공공기관</option>
                                <option value="기업">기업</option>
                            </select>
                        </div>
                        <button
                            className={styles.searchButton}
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            {loading ? '조회 중...' : '조회'}
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
                            <button onClick={handleSearch}>다시 시도</button>
                        </div>
                    )}

                    {/* 요약 카드 */}
                    {!loading && !error && (
                        <div className={styles.summaryCards}>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardTitle}>총 매출액</div>
                                <div className={styles.cardValue}>{summaryData.totalSales}</div>
                                <div className={styles.cardSubtext}>
                                    {searchLockerType === '전체' ? '전체 보관소' : `${searchLockerType} 보관소`} 이번 달
                                </div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardTitle}>총 거래수</div>
                                <div className={styles.cardValue}>{summaryData.totalTransactions}건</div>
                                <div className={styles.cardSubtext}>이번 달 누적</div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardTitle}>평균 거래금액</div>
                                <div className={styles.cardValue}>{summaryData.avgTransaction}</div>
                                <div className={styles.cardSubtext}>거래당 평균</div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardTitle}>
                                    {searchLockerType === '전체' ? '활성 보관소 수' : '이번 주 거래수'}
                                </div>
                                <div className={styles.cardValue}>
                                    {searchLockerType === '전체'
                                        ? `${summaryData.activeStorages}개`
                                        : `${Math.round(summaryData.totalTransactions / 4)}건`
                                    }
                                </div>
                                <div className={styles.cardSubtext}>
                                    {searchLockerType === '전체' ? '매출 발생 보관소' : '주간 평균'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 차트 섹션 */}
                    {!loading && !error && chartData.length > 0 && (
                        <div className={styles.chartSection}>
                            <StorageSalesChart
                                data={chartData}
                                chartType={chartType}
                                selectedLockerType={searchLockerType}
                            />
                        </div>
                    )}

                    {/* 보관소별 상세 목록 */}
                    <div className={styles.tableSection}>
                        <h3 className={styles.sectionTitle}>
                            {searchLockerType === '전체' ? '보관소별 상세 현황' : `${searchLockerType} 보관소 기간별 현황`}
                        </h3>

                        <div className={styles.tableContainer}>
                            <div className={styles.tableHeader}>
                                <div className={styles.headerCell}>
                                    {searchLockerType === '전체' ? '보관소 종류' : '기간'}
                                </div>
                                <div className={styles.headerCell}>매출액</div>
                                <div className={styles.headerCell}>거래수</div>
                                <div className={styles.headerCell}>평균 거래금액</div>
                                <div className={styles.headerCell}>수수료</div>
                                {/*<div className={styles.headerCell}>환불액</div>*/}
                            </div>

                            {!loading && !error && (
                                searchLockerType === '전체' && storageSalesData.length > 0 ? (
                                    // 전체 조회시 - 보관소별 데이터
                                    storageSalesData.map((storage) => (
                                        <div key={storage.id} className={styles.tableRow}>
                                            <div className={styles.cell}>
                                                <div className={styles.paymentInfo}>
                                                    <div className={styles.paymentMethod}>
                                                        {storage.method}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.cell}>{storage.sales}</div>
                                            <div className={styles.cell}>{storage.transactions}건</div>
                                            <div className={styles.cell}>{storage.avgAmount}</div>
                                            <div className={styles.cell}>{storage.fee}</div>
                                            {/*<div className={styles.cell}>{storage.refund}</div>*/}
                                        </div>
                                    ))
                                ) : searchLockerType !== '전체' && chartData.length > 0 ? (
                                    // 특정 보관소 조회시 - 기간별 데이터
                                    chartData.map((period, index) => (
                                        <div key={index} className={styles.tableRow}>
                                            <div className={styles.cell}>
                                                <div className={styles.paymentInfo}>
                                                    <div className={styles.paymentMethod}>
                                                        {period.name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.cell}>{period.sales.toLocaleString()}원</div>
                                            <div className={styles.cell}>{period.transactions}건</div>
                                            <div className={styles.cell}>{period.avgAmount.toLocaleString()}원</div>
                                            <div className={styles.cell}>{Math.round(period.sales * 0.05).toLocaleString()}원</div>
                                            {/*<div className={styles.cell}>0원</div>*/}
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.noData}>
                                        <p>해당 조건에 매출 데이터가 없습니다.</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StorageSales;