import { useState } from "react";
import { getPeriodSales } from "../api/admin/adminApi";
import dayjs from "dayjs";

export const usePeriodSales = () => {
    const [salesData, setSalesData] = useState([]); // 테이블용 데이터 (페이징됨)
    const [chartData, setChartData] = useState([]); // 차트용 데이터 (전체)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 페이징 관련 상태
    const [pagination, setPagination] = useState({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        size: 10,
        hasNext: false,
        hasPrevious: false
    });

    // 모든 데이터를 가져오는 함수 (날짜 범위 필터링 없이)
    const fetchAllSalesData = async (page = 0, size = 10) => {
        setLoading(true);
        setError(null);

        try {
            // 1. 테이블용 페이징된 데이터 가져오기 (날짜 범위 없이)
            const response = await getPeriodSales({
                // startDate와 endDate를 제거하거나 매우 넓은 범위로 설정
                startDate: '1900-01-01T00:00:00', // 충분히 과거
                endDate: '2100-12-31T23:59:59',   // 충분히 미래
                page,
                size
            });

            const { data } = response;

            // 에러 처리
            if (response.status === 500) {
                throw new Error(`서버 에러 (500): ${data.error || 'Internal Server Error'}`);
            }

            // 데이터가 없는 경우
            if (data.code === 3001 || !data.result?.content) {
                setSalesData([]);
                setChartData([]);
                setPagination({
                    currentPage: 0,
                    totalPages: 0,
                    totalElements: 0,
                    size: size,
                    hasNext: false,
                    hasPrevious: false
                });
                return;
            }

            // 페이징 정보 업데이트
            setPagination({
                currentPage: data.result.number,
                totalPages: data.result.totalPages,
                totalElements: data.result.totalElements,
                size: data.result.size,
                hasNext: !data.result.last,
                hasPrevious: !data.result.first
            });

            // 테이블용 데이터 (현재 페이지 데이터)
            const tableData = data.result.content.map((item, index) => {
                const mapped = {
                    time: item.settlementDate
                        ? dayjs(item.settlementDate, 'YYYY/MM/DD HH:mm').format('YY/MM/DD HH:mm:ss')
                        : '',
                    amount: item.amount ? `${item.amount.toLocaleString()}원` : '0원',
                    fee: item.paymentFee ? `${item.paymentFee.toString()}원` : '0원',
                    refund: '',
                    paymentMethod: item.paymentMethod || '알 수 없음'
                };

                return mapped;
            });
            setSalesData(tableData);

            // 2. 차트용 전체 데이터 가져오기 (첫 페이지일 때만)
            if (page === 0) {
                await fetchAllChartData();
            }

        } catch (err) {
            setError(err.message);
            setSalesData([]);
            setChartData([]);
            setPagination({
                currentPage: 0,
                totalPages: 0,
                totalElements: 0,
                size: size,
                hasNext: false,
                hasPrevious: false
            });
        } finally {
            setLoading(false);
        }
    };

    // 차트용 전체 데이터 가져오기
    const fetchAllChartData = async () => {
        try {
            const response = await getPeriodSales({
                // 전체 기간으로 설정
                startDate: '1900-01-01T00:00:00',
                endDate: '2100-12-31T23:59:59',
                page: 0,
                size: 10000 // 충분히 큰 사이즈로 전체 데이터 요청
            });

            if (response.data?.result?.content?.length) {
                const chartRawData = response.data.result.content.map((item) => ({
                    time: item.settlementDate || item.createdAt,
                    amount: item.amount || 0,
                    settlementDate: item.settlementDate,
                    createdAt: item.createdAt,
                    paymentFee: item.paymentFee,
                    paymentMethod: item.paymentMethod
                }));

                setChartData(chartRawData);
            } else {
                setChartData([]);
            }
        } catch (err) {
            // 차트 데이터 실패해도 테이블은 표시되도록 에러를 throw하지 않음
        }
    };

    return { salesData, chartData, pagination, loading, error, fetchAllSalesData };
};