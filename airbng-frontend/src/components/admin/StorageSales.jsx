import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/pages/StorageSalesPage.module.css';
import StorageSalesChart from './chart/StorageSalesChart';
import { useStorageSales } from '../../hooks/useStorageSales';

const StorageSales = () => {
    const [selectedLockerType, setSelectedLockerType] = useState('전체');
    const { storageSalesData, summaryData, loading, error, fetchStorageSales } = useStorageSales();

    // LockerType 매핑
    const getLockerTypeValue = (displayValue) => {
        switch (displayValue) {
            case '개인':
                return 'PERSONAL';
            case '공공기관':
                return 'PUBLIC';
            case '기업':
                return 'COMPANY';
            case '전체':
            default:
                return null; // null이면 전체 조회
        }
    };

    // 날짜 범위 설정 (현재 월)
    const getDateRange = () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // yyyy-MM-ddTHH:mm:ss 형식으로 포맷 (LocalDateTime 형식)
        const formatDate = (date) => {
            return date.toISOString().slice(0, 19);
        };

        return {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
        };
    };

    // 조회 버튼 클릭 핸들러
    const handleSearch = async () => {
        const lockerType = getLockerTypeValue(selectedLockerType);
        const { startDate, endDate } = getDateRange();

        console.log('🔍 조회 시작:', { lockerType, startDate, endDate });
        await fetchStorageSales({ lockerType, startDate, endDate });
    };

    // 컴포넌트 마운트 시 초기 데이터 로드
    useEffect(() => {
        const { startDate, endDate } = getDateRange();
        fetchStorageSales({
            lockerType: null, // 전체 조회
            startDate,
            endDate
        });
    }, []);

    // 차트용 데이터 변환
    const chartData = storageSalesData.map(storage => ({
        name: storage.method,
        sales: parseInt(storage.sales.replace(/[^\d]/g, '')),
        transactions: storage.transactions,
        avgAmount: parseInt(storage.avgAmount.replace(/[^\d]/g, ''))
    }));

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
                                onChange={(e) => setSelectedLockerType(e.target.value)}
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
                                <div className={styles.cardSubtext}>이번 달 누적</div>
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
                                <div className={styles.cardTitle}>활성 보관소 수</div>
                                <div className={styles.cardValue}>{summaryData.activeStorages}개</div>
                                <div className={styles.cardSubtext}>매출 발생 보관소</div>
                            </div>
                        </div>
                    )}

                    {/* 차트 섹션 */}
                    {!loading && !error && storageSalesData.length > 0 && (
                        <div className={styles.chartSection}>
                            <StorageSalesChart data={chartData} />
                        </div>
                    )}

                    {/* 보관소별 상세 목록 */}
                    <div className={styles.tableSection}>
                        <h3 className={styles.sectionTitle}>보관소별 상세 현황</h3>

                        <div className={styles.tableContainer}>
                            <div className={styles.tableHeader}>
                                <div className={styles.headerCell}>보관소 종류</div>
                                <div className={styles.headerCell}>매출액</div>
                                <div className={styles.headerCell}>거래수</div>
                                <div className={styles.headerCell}>평균 거래금액</div>
                                <div className={styles.headerCell}>수수료</div>
                                <div className={styles.headerCell}>환불액</div>
                            </div>

                            {!loading && !error && storageSalesData.length > 0 ? (
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
                                        <div className={styles.cell}>{storage.refund}</div>
                                    </div>
                                ))
                            ) : !loading && !error ? (
                                <div className={styles.noData}>
                                    <p>해당 조건에 매출 데이터가 없습니다.</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StorageSales;