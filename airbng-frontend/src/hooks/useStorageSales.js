// hooks/useStorageSales.js
import { useState } from "react";
import { getStorageSales } from "../api/admin/adminApi";

export const useStorageSales = () => {
    const [storageSalesData, setStorageSalesData] = useState([]);
    const [periodData, setPeriodData] = useState([]); // 기간별 데이터 추가
    const [summaryData, setSummaryData] = useState({
        totalSales: '0원',
        totalTransactions: 0,
        avgTransaction: '0원',
        activeStorages: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStorageSales = async ({ lockerType, startDate, endDate }) => {
        console.log('🔍 fetchStorageSales 호출됨:', { lockerType, startDate, endDate });

        setLoading(true);
        setError(null);

        try {
            let allResults = [];

            if (lockerType === null) {
                // 전체 조회: 3가지 타입을 병렬로 조회
                console.log('📡 전체 조회 - 3개 타입 병렬 조회 시작...');
                const lockerTypes = ['PERSONAL', 'PUBLIC', 'COMPANY'];

                const promises = lockerTypes.map(type =>
                    getStorageSales({ lockerType: type, startDate, endDate })
                );

                const responses = await Promise.all(promises);
                console.log('✅ 병렬 조회 완료:', responses);

                // 각 응답에서 결과 추출하고 합치기
                responses.forEach((response, index) => {
                    console.log(`📊 ${lockerTypes[index]} 응답:`, response.data);

                    if (response.status === 500) {
                        throw new Error(`서버 에러 (500) - ${lockerTypes[index]}: ${response.data.error || 'Internal Server Error'}`);
                    }

                    if (response.data.code !== 3001 && response.data.result?.length) {
                        allResults = [...allResults, ...response.data.result];
                    }
                });

            } else {
                // 특정 타입 조회
                console.log('📡 특정 타입 조회 시작...', lockerType);
                const response = await getStorageSales({ lockerType, startDate, endDate });
                const { data } = response;

                console.log('✅ 특정 타입 응답 받음:', response);
                console.log('📊 data.code:', data.code);
                console.log('📊 data.result:', data.result);

                // 500 에러인 경우 처리
                if (response.status === 500) {
                    throw new Error(`서버 에러 (500): ${data.error || 'Internal Server Error'}`);
                }

                // 성공 응답인 경우 결과 저장
                if (data.code !== 3001 && data.result?.length) {
                    allResults = data.result;
                }
            }

            // 데이터가 없는 경우
            if (!allResults.length) {
                console.log('⚠️ 조회된 데이터 없음');
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

            console.log('🔄 데이터 매핑 시작... 총', allResults.length, '개 항목');

            // 보관소 타입별로 데이터를 집계 (같은 타입이 여러 개 있을 수 있으므로)
            const aggregatedByType = {};

            allResults.forEach((item, index) => {
                console.log(`📝 처리 중 ${index}:`, item);

                const type = item.lockerType;
                if (!aggregatedByType[type]) {
                    aggregatedByType[type] = {
                        lockerType: type,
                        totalSales: 0,
                        totalCount: 0,
                        totalFee: 0,
                        lockerIds: []
                    };
                }

                aggregatedByType[type].totalSales += item.totalSales || 0;
                aggregatedByType[type].totalCount += item.totalCount || 0;
                aggregatedByType[type].totalFee += item.totalFee || 0;
                aggregatedByType[type].lockerIds.push(item.lockerId);
            });

            // 집계된 데이터를 화면 표시용으로 변환
            const mappedData = Object.values(aggregatedByType).map((aggregated, index) => {
                const averageSales = aggregated.totalCount > 0 ?
                    aggregated.totalSales / aggregated.totalCount : 0;

                const mapped = {
                    id: index + 1,
                    method: getLockerTypeDisplay(aggregated.lockerType),
                    sales: `${aggregated.totalSales.toLocaleString()}원`,
                    transactions: aggregated.totalCount,
                    avgAmount: `${Math.round(averageSales).toLocaleString()}원`,
                    fee: `${aggregated.totalFee.toLocaleString()}원`,
                    refund: '0원', // DTO에 환불 필드가 없어서 임시로 0원
                    lockerType: aggregated.lockerType,
                    lockerCount: aggregated.lockerIds.length // 해당 타입의 보관소 개수
                };

                console.log(`✅ 집계 매핑 완료 ${aggregated.lockerType}:`, mapped);
                return mapped;
            });

            // 전체 요약 데이터 계산
            const totalSales = Object.values(aggregatedByType)
                .reduce((sum, agg) => sum + agg.totalSales, 0);
            const totalTransactions = Object.values(aggregatedByType)
                .reduce((sum, agg) => sum + agg.totalCount, 0);
            const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
            const totalLockers = Object.values(aggregatedByType)
                .reduce((sum, agg) => sum + agg.lockerIds.length, 0);

            const calculatedSummary = {
                totalSales: `${totalSales.toLocaleString()}원`,
                totalTransactions: totalTransactions,
                avgTransaction: `${Math.round(avgTransaction).toLocaleString()}원`,
                activeStorages: totalLockers
            };

            console.log('🎉 최종 매핑된 데이터:', mappedData);
            console.log('📊 계산된 요약 데이터:', calculatedSummary);

            setStorageSalesData(mappedData);
            setSummaryData(calculatedSummary);

        } catch (err) {
            console.error('❌ API 호출 에러:', err);
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
            console.log('🔚 fetchStorageSales 완료');
        }
    };

    // 특정 보관소의 기간별 매출 데이터 조회
    const fetchStorageSalesByPeriod = async ({ lockerType, startDate, endDate }) => {
        console.log('🔍 fetchStorageSalesByPeriod 호출됨:', { lockerType, startDate, endDate });

        setLoading(true);
        setError(null);

        try {
            // 실제로는 기간별 API를 호출해야 하지만, 현재는 기존 API로 데이터를 받아서 가공
            const response = await getStorageSales({ lockerType, startDate, endDate });
            const { data } = response;

            if (response.status === 500) {
                throw new Error(`서버 에러 (500): ${data.error || 'Internal Server Error'}`);
            }

            let totalSales = 0;
            let totalCount = 0;
            let totalFee = 0;

            if (data.code !== 3001 && data.result?.length) {
                // 실제 데이터가 있는 경우 집계
                data.result.forEach(item => {
                    totalSales += item.totalSales || 0;
                    totalCount += item.totalCount || 0;
                    totalFee += item.totalFee || 0;
                });
            }

            // 기간별 데이터 생성 (실제로는 API에서 주/일별 데이터를 받아와야 함)
            const periodicalData = generatePeriodData(totalSales, totalCount);

            // 요약 데이터 계산
            const avgTransaction = totalCount > 0 ? totalSales / totalCount : 0;
            const calculatedSummary = {
                totalSales: `${totalSales.toLocaleString()}원`,
                totalTransactions: totalCount,
                avgTransaction: `${Math.round(avgTransaction).toLocaleString()}원`,
                activeStorages: data.result?.length || 0
            };

            console.log('🎉 기간별 데이터 생성 완료:', periodicalData);
            console.log('📊 특정 보관소 요약 데이터:', calculatedSummary);

            setPeriodData(periodicalData);
            setStorageSalesData([]); // 특정 보관소 조회시에는 보관소별 데이터 클리어
            setSummaryData(calculatedSummary);

        } catch (err) {
            console.error('❌ 기간별 API 호출 에러:', err);
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
            console.log('🔚 fetchStorageSalesByPeriod 완료');
        }
    };

    // 기간별 데이터 생성 함수 (실제로는 API에서 받아와야 함)
    const generatePeriodData = (totalSales, totalCount) => {
        const periods = ['1주차', '2주차', '3주차', '4주차'];
        const baseSales = totalSales / 4;
        const baseCount = Math.max(1, Math.round(totalCount / 4));

        return periods.map((period, index) => {
            // 약간의 변동성을 주어서 현실적인 데이터 생성
            const variance = 0.7 + Math.random() * 0.6; // 0.7 ~ 1.3 사이의 변동
            const sales = Math.round(baseSales * variance);
            const transactions = Math.max(1, Math.round(baseCount * variance));
            const avgAmount = transactions > 0 ? Math.round(sales / transactions) : 0;

            return {
                name: period,
                sales: sales,
                transactions: transactions,
                avgAmount: avgAmount
            };
        });
    };

    // LockerType을 화면에 표시할 텍스트로 변환
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