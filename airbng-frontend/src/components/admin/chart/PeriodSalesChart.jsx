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
} from "recharts";
import styles from '../../../styles/admin/chart/PeriodSalesChart.module.css';

const PeriodSalesChart = ({ data, activeTab }) => {
    // 차트용 데이터 변환
    const convertDataForChart = (rawData, tab) => {
        if (!rawData || rawData.length === 0) return [];

        return rawData.map((item, index) => {
            // amount에서 숫자만 추출 (예: "125,000원" -> 125000)
            const numericAmount = parseInt(item.amount.replace(/[^\d]/g, ''));

            return {
                name: item.time,
                sales: numericAmount,
                orders: Math.floor(numericAmount / 1000), // 예시로 매출의 1/1000을 주문수로 설정
                region: item.region,
                paymentMethod: item.paymentMethod
            };
        });
    };

    // 샘플 데이터 (데이터가 없을 때 사용)
    const defaultData = [
        { name: '1월', sales: 4000000, orders: 240 },
        { name: '2월', sales: 3000000, orders: 198 },
        { name: '3월', sales: 2000000, orders: 180 },
        { name: '4월', sales: 2780000, orders: 308 },
        { name: '5월', sales: 1890000, orders: 180 },
        { name: '6월', sales: 2390000, orders: 280 },
        { name: '7월', sales: 3490000, orders: 330 },
    ];

    const chartData = data ? convertDataForChart(data, activeTab) : defaultData;

    const getTitle = () => {
        if (activeTab === 'daily') return '주간 매출 추이';
        if (activeTab === 'monthly') return '월간 매출 추이';
        return '연간 매출 추이';
    };

    // 커스텀 툴팁
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.customTooltip}>
                    <p className={styles.tooltipLabel}>{`${label}${activeTab === 'daily' ? '시' : activeTab === 'monthly' ? '월' : '년'}`}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.dataKey === 'sales' ? '매출: ' : '주문수: '}
                            <span className={styles.tooltipValue}>
                                {entry.dataKey === 'sales'
                                    ? `${entry.value.toLocaleString()}원`
                                    : `${entry.value}건`}
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.chartContainer}>
            <h3 className={styles.chartTitle}>{getTitle()}</h3>
            <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart
                        data={chartData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
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
                            name="주문"
                            fill="#4561DB"
                            fillOpacity={0.6}
                            radius={[4, 4, 0, 0]}
                            barSize={60}
                        />

                        {/* 라인 차트 - 주문수 */}
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="orders"
                            name="매출"
                            stroke="#28a745"
                            strokeWidth={3}
                            dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#28a745', strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PeriodSalesChart;