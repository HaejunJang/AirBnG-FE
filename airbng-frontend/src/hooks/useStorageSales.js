// hooks/useStorageSales.js
import { useState } from "react";
import { getStorageSales } from "../api/admin/adminApi";

export const useStorageSales = () => {
    const [storageSalesData, setStorageSalesData] = useState([]);
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
            console.error('❌ 에러 메시지:', err.message);
            console.error('❌ 에러 응답:', err.response);
            console.error('❌ 에러 상태:', err.response?.status);
            console.error('❌ 에러 데이터:', err.response?.data);

            setError(err.message);
            setStorageSalesData([]);
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

    return { storageSalesData, summaryData, loading, error, fetchStorageSales };
};