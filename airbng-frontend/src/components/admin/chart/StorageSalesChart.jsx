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

const StorageSalesChart = ({ data }) => {
    // 파이차트용 색상
    const COLORS = ['#4561DB', '#28a745', '#ffc107', '#17a2b8', '#6f42c1'];

    // 커스텀 툴팁
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
    const PieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            // 전체 매출 합계 계산
            const totalSales = payload[0].payload.totalSales || 1;
            // 현재 항목의 매출
            const sales = data.value;
            // 점유율 계산
            const percentage = ((sales / totalSales) * 100).toFixed(1);

            return (
                <div className={styles.customTooltip}>
                    <p className={styles.tooltipLabel}>{data.name}</p>
                    <p style={{ color: data.color }}>
                        점유율: <span className={styles.tooltipValue}>{percentage}%</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.chartSection}>
            {/* 매출 및 거래 현황 차트 */}
            {/*<div className={styles.chartContainer}>*/}
            {/*    <h3 className={styles.chartTitle}>결제수단별 매출 및 거래 현황</h3>*/}
            {/*    <div className={styles.chartWrapper}>*/}
            {/*        <ResponsiveContainer width="100%" height={400}>*/}
            {/*            <ComposedChart*/}
            {/*                data={data}*/}
            {/*                margin={{*/}
            {/*                    top: 20,*/}
            {/*                    right: 30,*/}
            {/*                    left: 20,*/}
            {/*                    bottom: 5,*/}
            {/*                }}*/}
            {/*            >*/}
            {/*                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />*/}
            {/*                <XAxis*/}
            {/*                    dataKey="name"*/}
            {/*                    tick={{ fontSize: 12 }}*/}
            {/*                    axisLine={{ stroke: '#e0e0e0' }}*/}
            {/*                />*/}
            {/*                <YAxis*/}
            {/*                    yAxisId="left"*/}
            {/*                    tick={{ fontSize: 12 }}*/}
            {/*                    axisLine={{ stroke: '#e0e0e0' }}*/}
            {/*                />*/}
            {/*                <YAxis*/}
            {/*                    yAxisId="right"*/}
            {/*                    orientation="right"*/}
            {/*                    tick={{ fontSize: 12 }}*/}
            {/*                    axisLine={{ stroke: '#e0e0e0' }}*/}
            {/*                />*/}
            {/*                <Tooltip content={<CustomTooltip />} />*/}
            {/*                <Legend />*/}

            {/*               /!* 바 차트 - 매출 *!/*!/*/}
            {/*                /!*<Bar*!/*/}
            {/*                /!*    yAxisId="left"*!/*/}
            {/*                /!*    dataKey="sales"*!/*/}
            {/*                /!*    name="매출"*!/*/}
            {/*                /!*    fill="#4561DB"*!/*/}
            {/*                /!*    fillOpacity={0.7}*!/*/}
            {/*                /!*    radius={[4, 4, 0, 0]}*!/*/}
            {/*                /!*//*/}

            {/*                /!* 라인 차트 - 거래수 *!/*/}
            {/*                <Line*/}
            {/*                    yAxisId="right"*/}
            {/*                    type="monotone"*/}
            {/*                    dataKey="transactions"*/}
            {/*                    name="짐페이"*/}
            {/*                    stroke="#28a745"*/}
            {/*                    strokeWidth={3}*/}
            {/*                    dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}*/}
            {/*                    activeDot={{ r: 6, stroke: '#28a745', strokeWidth: 2 }}*/}
            {/*                />*/}

            {/*                /!* 라인 차트 - 평균 거래금액 *!/*/}
            {/*                <Line*/}
            {/*                    yAxisId="right"*/}
            {/*                    type="monotone"*/}
            {/*                    dataKey="avgAmount"*/}
            {/*                    name="PG사"*/}
            {/*                    stroke="#ffc107"*/}
            {/*                    strokeWidth={2}*/}
            {/*                    strokeDasharray="5 5"*/}
            {/*                    dot={{ fill: '#ffc107', strokeWidth: 2, r: 3 }}*/}
            {/*                    activeDot={{ r: 5, stroke: '#ffc107', strokeWidth: 2 }}*/}
            {/*                />*/}
            {/*            </ComposedChart>*/}
            {/*        </ResponsiveContainer>*/}
            {/*    </div>*/}
            {/*</div>*/}

            {/* 점유율 파이차트 */}
            <div className={styles.chartContainer}>
                <h3 className={styles.chartTitle}>보관소별 매출액</h3>
                <div className={styles.pieChartWrapper}>
                    <div className={styles.pieChart}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="sales"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 범례 */}
                    <div className={styles.pieLegend}>
                        {data.map((item, index) => (
                            <div key={index} className={styles.legendItem}>
                                <div
                                    className={styles.legendColor}
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                ></div>
                                <span className={styles.legendText}>
                                    {item.name} ({((item.sales / data.reduce((sum, curr) => sum + curr.sales, 0)) * 100).toFixed(1)}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StorageSalesChart;