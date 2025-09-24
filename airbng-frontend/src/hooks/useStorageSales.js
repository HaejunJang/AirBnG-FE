import { useState } from "react";
import { getStorageSales } from "../api/admin/adminApi";

export const useStorageSales = () => {
    const [storageSalesData, setStorageSalesData] = useState([]);
    const [periodData, setPeriodData] = useState([]);
    const [summaryData, setSummaryData] = useState({
        totalSales: '0원',
        totalTransactions: 0,
        avgTransaction: '0원',
        activeStorages: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStorageSales = async ({ lockerType, startDate, endDate }) => {
        setLoading(true);
        setError(null);

        try {
            let allResults = [];
            let typeAggregates = {};

            if (lockerType === null) {
                // 전체 조회: 3가지 타입을 병렬로 조회
                const lockerTypes = ['PERSONAL', 'PUBLIC', 'COMPANY'];

                const promises = lockerTypes.map(type =>
                    getStorageSales({ lockerType: type, startDate, endDate, page: 0, size: 100 })
                );

                const responses = await Promise.all(promises);

                // 각 응답에서 결과 추출
                responses.forEach((response, index) => {
                    const currentType = lockerTypes[index];

                    if (response.status === 500) {
                        throw new Error(`서버 에러 (500) - ${currentType}: ${response.data.error || 'Internal Server Error'}`);
                    }

                    // 백엔드에서 받은 개별 보관소 데이터들을 타입별로 집계
                    if (response.data.code !== 3001 && response.data.result?.content?.length) {
                        const typeData = response.data.result.content;

                        // 각 타입별로 집계 (lockerId별로 받은 데이터를 타입 단위로 합산)
                        const typeSum = typeData.reduce((acc, item) => ({
                            totalSales: acc.totalSales + (item.totalSales || 0),
                            totalCount: acc.totalCount + (item.totalCount || 0),
                            totalFee: acc.totalFee + (item.totalFee || 0),
                            lockerIds: [...acc.lockerIds, item.lockerId]
                        }), {
                            totalSales: 0,
                            totalCount: 0,
                            totalFee: 0,
                            lockerIds: []
                        });

                        typeAggregates[currentType] = {
                            lockerType: currentType,
                            totalSales: typeSum.totalSales,
                            totalCount: typeSum.totalCount,
                            totalFee: typeSum.totalFee,
                            uniqueLockers: [...new Set(typeSum.lockerIds)].length
                        };
                    }
                });

                allResults = Object.values(typeAggregates);

            } else {
                // 특정 타입 조회
                const response = await getStorageSales({ lockerType, startDate, endDate, page: 0, size: 100 });
                const { data } = response;

                if (response.status === 500) {
                    throw new Error(`서버 에러 (500): ${data.error || 'Internal Server Error'}`);
                }

                if (data.code !== 3001 && data.result?.content?.length) {
                    // 해당 타입의 데이터 집계 (lockerId별 데이터를 합산)
                    const typeSum = data.result.content.reduce((acc, item) => ({
                        totalSales: acc.totalSales + (item.totalSales || 0),
                        totalCount: acc.totalCount + (item.totalCount || 0),
                        totalFee: acc.totalFee + (item.totalFee || 0),
                        lockerIds: [...acc.lockerIds, item.lockerId]
                    }), {
                        totalSales: 0,
                        totalCount: 0,
                        totalFee: 0,
                        lockerIds: []
                    });

                    allResults.push({
                        lockerType: lockerType,
                        totalSales: typeSum.totalSales,
                        totalCount: typeSum.totalCount,
                        totalFee: typeSum.totalFee,
                        uniqueLockers: [...new Set(typeSum.lockerIds)].length
                    });
                }
            }

            // 데이터가 없는 경우
            if (!allResults.length) {
                setStorageSalesData([]);
                setPeriodData([]);
                setSummaryData({
                    totalSales: '0원',
                    totalTransactions: 0,
                    avgTransaction: '0원',
                    activeStorages: 0
                });
                return;
            }

            // 화면 표시용 데이터 변환
            const mappedData = allResults.map((aggregated, index) => {
                const averageSales = aggregated.totalCount > 0 ?
                    aggregated.totalSales / aggregated.totalCount : 0;

                const mapped = {
                    id: index + 1,
                    method: getLockerTypeDisplay(aggregated.lockerType),
                    sales: `${aggregated.totalSales.toLocaleString()}원`,
                    transactions: aggregated.totalCount,
                    avgAmount: `${Math.round(averageSales).toLocaleString()}원`,
                    fee: `${aggregated.totalFee.toLocaleString()}원`,
                    refund: '0원',
                    lockerType: aggregated.lockerType,
                    lockerCount: aggregated.uniqueLockers
                };

                return mapped;
            });

            // 전체 요약 데이터 계산
            const totalSales = allResults.reduce((sum, agg) => sum + agg.totalSales, 0);
            const totalTransactions = allResults.reduce((sum, agg) => sum + agg.totalCount, 0);
            const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
            const totalLockers = allResults.reduce((sum, agg) => sum + agg.uniqueLockers, 0);

            const calculatedSummary = {
                totalSales: `${totalSales.toLocaleString()}원`,
                totalTransactions: totalTransactions,
                avgTransaction: `${Math.round(avgTransaction).toLocaleString()}원`,
                activeStorages: totalLockers
            };

            setStorageSalesData(mappedData);
            setSummaryData(calculatedSummary);

        } catch (err) {
            setError(err.message);
            setStorageSalesData([]);
            setPeriodData([]);
            setSummaryData({
                totalSales: '0원',
                totalTransactions: 0,
                avgTransaction: '0원',
                activeStorages: 0
            });
        } finally {
            setLoading(false);
        }
    };

    // 특정 보관소의 기간별 매출 데이터 조회
    const fetchStorageSalesByPeriod = async ({ lockerType, startDate, endDate }) => {
        setLoading(true);
        setError(null);

        try {
            const response = await getStorageSales({ lockerType, startDate, endDate, page: 0, size: 100 });
            const { data } = response;

            if (response.status === 500) {
                throw new Error(`서버 에러 (500): ${data.error || 'Internal Server Error'}`);
            }

            const salesData = data.result?.content || [];

            if (!salesData.length) {
                setPeriodData([]);
                setStorageSalesData([]);
                setSummaryData({
                    totalSales: '0원',
                    totalTransactions: 0,
                    avgTransaction: '0원',
                    activeStorages: 0
                });
                return;
            }

            // 날짜별로 데이터 그룹핑 (해당 보관소 타입의 데이터만 집계)
            const dateGroups = {};

            salesData.forEach(item => {
                // 보관소 타입 확인 - 요청한 타입과 일치하지 않으면 제외
                if (item.lockerType !== lockerType) {
                    return;
                }

                // aggregatedDate를 사용 (실제 백엔드 응답 기준)
                let dateValue = null;

                if (item.aggregatedDate) {
                    // aggregatedDate가 문자열 형태 ("yyyy-MM-dd'T'HH:mm:ss")
                    dateValue = new Date(item.aggregatedDate);
                } else if (item.updatedAt) {
                    dateValue = new Date(item.updatedAt);
                } else {
                    // 다른 날짜 필드들 시도
                    const dateStr = item.aggregateDate || item.createdAt || item.date;
                    if (dateStr) {
                        dateValue = new Date(dateStr);
                    }
                }

                if (!dateValue || isNaN(dateValue.getTime())) {
                    dateValue = new Date();
                }

                const dateKey = dateValue.toDateString();

                if (!dateGroups[dateKey]) {
                    dateGroups[dateKey] = {
                        date: dateValue,
                        totalSales: 0,
                        totalCount: 0,
                        totalFee: 0,
                        lockerIds: []
                    };
                }

                // 해당 보관소 타입의 같은 날짜 데이터들만 합산
                dateGroups[dateKey].totalSales += item.totalSales || 0;
                dateGroups[dateKey].totalCount += item.totalCount || 0;
                dateGroups[dateKey].totalFee += item.totalFee || 0;
                dateGroups[dateKey].lockerIds.push(item.lockerId);
            });

            // 날짜별 집계된 데이터를 기간별 데이터로 변환
            const periodicalData = Object.values(dateGroups)
                .map(group => {
                    const dateKey = `${group.date.getMonth() + 1}/${group.date.getDate()}`;
                    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                    const dayName = dayNames[group.date.getDay()];

                    return {
                        name: `${dateKey}(${dayName})`,
                        sales: group.totalSales,
                        transactions: group.totalCount,
                        avgAmount: group.totalCount > 0 ? Math.round(group.totalSales / group.totalCount) : 0,
                        date: group.date
                    };
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date)); // 내림차순 정렬 (최신 날짜가 위로)

            // 요약 데이터 계산
            const totalSales = periodicalData.reduce((sum, item) => sum + item.sales, 0);
            const totalCount = periodicalData.reduce((sum, item) => sum + item.transactions, 0);

            const avgTransaction = totalCount > 0 ? totalSales / totalCount : 0;
            const uniqueLockers = [...new Set(Object.values(dateGroups).flatMap(g => g.lockerIds))].length;

            const calculatedSummary = {
                totalSales: `${totalSales.toLocaleString()}원`,
                totalTransactions: totalCount,
                avgTransaction: `${Math.round(avgTransaction).toLocaleString()}원`,
                activeStorages: uniqueLockers
            };

            setPeriodData(periodicalData);
            setStorageSalesData([]);
            setSummaryData(calculatedSummary);

        } catch (err) {
            setError(err.message);
            setPeriodData([]);
            setStorageSalesData([]);
            setSummaryData({
                totalSales: '0원',
                totalTransactions: 0,
                avgTransaction: '0원',
                activeStorages: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const getLockerTypeDisplay = (lockerType) => {
        switch (lockerType) {
            case 'PERSONAL':
                return '개인 보관소';
            case 'PUBLIC':
                return '공공기관 보관소';
            case 'COMPANY':
                return '기업 보관소';
            default:
                return lockerType || '알 수 없음';
        }
    };

    return {
        storageSalesData,
        periodData,
        summaryData,
        loading,
        error,
        fetchStorageSales,
        fetchStorageSalesByPeriod
    };
};