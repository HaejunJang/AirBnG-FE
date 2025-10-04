import React from 'react';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import styles from '../../../styles/admin/chart/StorageChart.module.css';
import dayjs from 'dayjs';

const StorageSalesChart = ({ data, chartType = 'pie', selectedLockerType = '전체' }) => {
    // 파이차트용 색상
    const COLORS = ['#4561DB', '#28a745', '#ffc107', '#17a2b8', '#6f42c1'];

    // 요일 라벨 (일~토) - dayjs().day()는 일요일이 0부터 시작
    const WEEKDAY_KOR = ['일', '월', '화', '수', '목', '금', '토'];

    // 날짜를 안전하게 파싱하는 함수
    const parseDateSafe = (value) => {
        if (!value) return null;
        if (dayjs.isDayjs(value)) return value;
        if (value instanceof Date) return dayjs(value);

        let asString = String(value);

        // 2자리 연도를 4자리로 변환
        const twoDigitYearPattern = /^(\d{2})\/(\d{2})\/(\d{2})/;
        const match = asString.match(twoDigitYearPattern);
        if (match) {
            const year = parseInt(match[1]);
            const fullYear = year >= 50 ? 1900 + year : 2000 + year;
            asString = asString.replace(twoDigitYearPattern, `${fullYear}/$2/$3`);
        }

        const tryFormats = [
            'YYYY/MM/DD HH:mm:ss',
            'YYYY-MM-DDTHH:mm:ss',
            'YYYY-MM-DD HH:mm:ss',
            'YYYY-MM-DDTHH:mm:ss.SSS',
            'YYYY-MM-DD HH:mm:ss.SSSSSS',
            'YYYY/MM/DD HH:mm',
            'YYYY/MM/DD',
            'YYYY-MM-DD',
        ];

        for (const fmt of tryFormats) {
            const d = dayjs(asString, fmt);
            if (d.isValid()) return d;
        }

        const d = dayjs(asString);
        return d.isValid() ? d : null;
    };

    // 주간 데이터로 변환하는 함수
    const convertToWeeklyData = (rawData) => {
        if (!rawData || rawData.length === 0) return [];

        // 오늘 기준 최근 7일 (오늘 포함)
        const today = dayjs();
        const startDate = today.subtract(6, 'day');

        // 최근 7일 버킷 생성
        const weeklyBuckets = Array.from({ length: 7 }).map((_, idx) => {
            const d = startDate.add(idx, 'day');
            return {
                date: d.format('YYYY-MM-DD'),
                displayDate: d.format('M/D'),
                weekday: WEEKDAY_KOR[d.day()],
                sales: 0,
                transactions: 0,
                totalAmount: 0, // 평균 계산을 위한 총액
            };
        });

        // 실제 데이터로 버킷 채우기
        rawData.forEach((item) => {
            // 날짜 필드들을 확인하여 유효한 날짜 찾기
            const dateValue = item.date || item.time || item.settlementDate || item.createdAt;
            const d = parseDateSafe(dateValue);

            if (!d) return;

            // 최근 7일 범위 체크
            if (d.isBefore(startDate, 'day') || d.isAfter(today, 'day')) {
                return; // 범위 밖이면 스킵
            }

            const dateStr = d.format('YYYY-MM-DD');
            const bucketIndex = weeklyBuckets.findIndex(b => b.date === dateStr);

            if (bucketIndex !== -1) {
                const sales = typeof item.sales === 'number' ? item.sales :
                    typeof item.amount === 'number' ? item.amount : 0;
                const transactions = typeof item.transactions === 'number' ? item.transactions : 1;

                weeklyBuckets[bucketIndex].sales += sales;
                weeklyBuckets[bucketIndex].transactions += transactions;
                weeklyBuckets[bucketIndex].totalAmount += sales;
            }
        });

        // 평균 거래금액 계산 및 최종 데이터 반환
        return weeklyBuckets
            .filter(bucket => bucket.sales > 0 || bucket.transactions > 0) // 데이터가 있는 날짜만
            .map(bucket => ({
                name: `${bucket.displayDate}(${bucket.weekday})`, // ex: 9/18(수)
                sales: bucket.sales,
                transactions: bucket.transactions,
                avgAmount: bucket.transactions > 0 ? Math.round(bucket.totalAmount / bucket.transactions) : 0,
            }));
    };

    // 커스텀 툴팁 (막대+선 차트용)
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.customTooltip}>
                    <p className={styles.tooltipLabel}>{`${label}`}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.dataKey === 'sales' && '매출: '}
                            {entry.dataKey === 'transactions' && '거래수: '}
                            {entry.dataKey === 'avgAmount' && '평균금액: '}
                            <span className={styles.tooltipValue}>
                                {entry.dataKey === 'sales' && `${entry.value.toLocaleString()}원`}
                                {entry.dataKey === 'transactions' && `${entry.value}건`}
                                {entry.dataKey === 'avgAmount' && `${entry.value.toLocaleString()}원`}
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // 파이차트 툴팁
    const PieTooltip = ({ active, payload, data }) => {
        if (active && payload && payload.length && data) {
            const item = payload[0];
            const totalSales = data.reduce((sum, curr) => sum + curr.sales, 0) || 1;
            const sales = item.value;
            const percentage = ((sales / totalSales) * 100).toFixed(1);

            return (
                <div className={styles.customTooltip}>
                    <p className={styles.tooltipLabel}>{item.name}</p>
                    <p style={{ color: item.color }}>
                        매출: <span className={styles.tooltipValue}>{sales.toLocaleString()}원</span>
                    </p>
                    <p style={{ color: item.color }}>
                        점유율: <span className={styles.tooltipValue}>{percentage}%</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    // 보관소별 주간 데이터로 변환하는 함수 (파이차트용)
    const convertToWeeklyStorageData = (rawData) => {
        if (!rawData || rawData.length === 0) return [];

        // 오늘 기준 최근 7일
        const today = dayjs();
        const startDate = today.subtract(6, 'day');

        // 보관소별 데이터를 집계
        const storageMap = {};

        rawData.forEach((item) => {
            const dateValue = item.date || item.time || item.settlementDate || item.createdAt;
            const d = parseDateSafe(dateValue);

            if (!d) return;

            // 최근 7일 범위 체크
            if (d.isBefore(startDate, 'day') || d.isAfter(today, 'day')) {
                return;
            }

            const storageName = item.name || item.storageName || item.lockerType || '알 수 없음';
            const sales = typeof item.sales === 'number' ? item.sales :
                typeof item.amount === 'number' ? item.amount : 0;

            if (!storageMap[storageName]) {
                storageMap[storageName] = {
                    name: storageName,
                    sales: 0,
                    transactions: 0
                };
            }

            storageMap[storageName].sales += sales;
            storageMap[storageName].transactions += 1;
        });

        return Object.values(storageMap).filter(item => item.sales > 0);
    };

    // 파이차트 렌더링 (보관소별 주간 데이터 사용)
    const renderPieChart = () => {
        // data가 이미 보관소별로 집계된 데이터인 경우와 원시 거래 데이터인 경우를 구분
        const pieData = Array.isArray(data) && data.length > 0 && data[0].name && data[0].sales
            ? data // 이미 집계된 보관소별 데이터
            : convertToWeeklyStorageData(data); // 원시 데이터를 보관소별로 집계

        return (
            <div className={styles.chartContainer}>
                <h3 className={styles.chartTitle}>주간 보관소별 매출 점유율</h3>
                <div className={styles.pieChartWrapper}>
                    <div className={styles.pieChart}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="sales"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={(props) => <PieTooltip {...props} data={pieData} />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 범례 */}
                    <div className={styles.pieLegend}>
                        {pieData.map((item, index) => {
                            const totalSales = pieData.reduce((sum, curr) => sum + curr.sales, 0);
                            const percentage = totalSales > 0 ? ((item.sales / totalSales) * 100).toFixed(1) : 0;

                            return (
                                <div key={index} className={styles.legendItem}>
                                    <div
                                        className={styles.legendColor}
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    ></div>
                                    <span className={styles.legendText}>
                                        {item.name} ({percentage}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // 막대+선 차트 렌더링 (주간 데이터용)
    const renderComposedChart = () => {
        const weeklyData = convertToWeeklyData(data);

        return (
            <div className={styles.chartContainer}>
                <h3 className={styles.chartTitle}>
                    {selectedLockerType} 보관소 주간 매출 추이
                </h3>
                <div className={styles.chartWrapper}>
                    <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart
                            data={weeklyData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                            barCategoryGap="20%"
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                axisLine={{ stroke: '#e0e0e0' }}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 12 }}
                                axisLine={{ stroke: '#e0e0e0' }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fontSize: 12 }}
                                axisLine={{ stroke: '#e0e0e0' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />

                            {/* 바 차트 - 매출 */}
                            <Bar
                                yAxisId="left"
                                dataKey="sales"
                                name="매출액"
                                fill="#4561DB"
                                fillOpacity={0.7}
                                radius={[4, 4, 0, 0]}
                                barSize={60}
                            />

                            {/* 라인 차트 - 거래수 */}
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="transactions"
                                name="거래수"
                                stroke="#28a745"
                                strokeWidth={3}
                                dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: '#28a745', strokeWidth: 2 }}
                            />

                            {/* 라인 차트 - 평균 거래금액 */}
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="avgAmount"
                                name="평균 거래금액"
                                stroke="#ffc107"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: '#ffc107', strokeWidth: 2, r: 3 }}
                                activeDot={{ r: 5, stroke: '#ffc107', strokeWidth: 2 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.chartSection}>
            {chartType === 'pie' ? renderPieChart() : renderComposedChart()}
        </div>
    );
};

export default StorageSalesChart;