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
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

// 요일 라벨 (월~일)
const WEEKDAY_KOR = ['월', '화', '수', '목', '금', '토', '일'];

const PeriodSalesChart = ({ data = [], activeTab }) => {
    // 2자리 연도를 4자리로 변환하는 함수
    const convertTwoDigitYear = (dateString) => {
        // YY/MM/DD 형식인지 확인
        const twoDigitYearPattern = /^(\d{2})\/(\d{2})\/(\d{2})/;
        const match = dateString.match(twoDigitYearPattern);

        if (match) {
            const year = parseInt(match[1]);
            // 50 이상이면 19xx, 50 미만이면 20xx로 처리 (일반적인 규칙)
            const fullYear = year >= 50 ? 1900 + year : 2000 + year;
            return dateString.replace(twoDigitYearPattern, `${fullYear}/$2/$3`);
        }

        return dateString;
    };

    // 문자열/Date 여러 포맷을 안전히 파싱해서 dayjs 객체 반환 (실패 시 null)
    const parseDateSafe = (value) => {
        if (!value) return null;
        // 이미 dayjs/Date 인스턴스이면 처리
        if (dayjs.isDayjs(value)) return value;
        if (value instanceof Date) return dayjs(value);

        let asString = String(value);

        // 2자리 연도를 4자리로 변환
        asString = convertTwoDigitYear(asString);

        console.log('변환된 날짜 문자열:', asString); // 디버깅용

        // 시도할 포맷 배열 (우선순위)
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

        // 먼저 포맷별로 시도
        for (const fmt of tryFormats) {
            const d = dayjs(asString, fmt);
            if (d.isValid()) {
                console.log(`성공한 포맷: ${fmt}, 파싱된 날짜:`, d.format('YYYY-MM-DD HH:mm:ss')); // 디버깅용
                return d;
            }
        }

        // 마이크로초(.000000) 제거 + 공백->T 변환 후 시도
        let cleaned = asString.replace(/\.\d+$/, '').replace(' ', 'T');
        let d = dayjs(cleaned);
        if (d.isValid()) {
            console.log('정리된 문자열로 파싱 성공:', d.format('YYYY-MM-DD HH:mm:ss')); // 디버깅용
            return d;
        }

        // 최종 fallback: 기본 파서
        d = dayjs(asString);
        if (d.isValid()) {
            console.log('기본 파서로 파싱 성공:', d.format('YYYY-MM-DD HH:mm:ss')); // 디버깅용
            return d;
        }

        console.warn('날짜 파싱 실패:', value); // 디버깅용
        return null;
    };

    // amount가 숫자이든 "4,700원"이든 안전히 숫자 반환
    const parseAmount = (amount) => {
        if (amount == null) return 0;
        if (typeof amount === 'number') return amount;
        const n = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        return Number.isNaN(n) ? 0 : n;
    };

    // 집계 함수: daily, monthly, yearly에 따라 결과 배열 반환
    const convertDataForChart = (rawData, tab) => {
        if (!rawData || rawData.length === 0) {
            return [];
        }

        console.log('차트 데이터 변환 시작:', { rawData: rawData.length, tab }); // 디버깅용

        if (tab === 'daily') {
            // 오늘 기준 최근 7일
            const today = dayjs();
            const startDate = today.subtract(6, 'day'); // 오늘 포함 7일 전부터 시작

            // 날짜별 버킷 생성 (연속된 7일)
            const buckets = Array.from({ length: 7 }).map((_, idx) => {
                const d = startDate.add(idx, 'day');
                return {
                    date: d.format('YYYY-MM-DD'),
                    sales: 0,
                    count: 0,
                };
            });

            rawData.forEach((item, index) => {
                const d = parseDateSafe(item.time || item.settlementDate || item.createdAt);
                if (!d) {
                    console.warn(`날짜 파싱 실패 (${index}):`, item);
                    return;
                }
                if (d.isBefore(startDate, 'day') || d.isAfter(today, 'day')) {
                    return; // 최근 7일 범위 밖이면 스킵
                }

                const idx = d.diff(startDate, 'day'); // 0 ~ 6 인덱스
                const amt = parseAmount(item.amount);
                buckets[idx].sales += amt;
                buckets[idx].count += 1;
            });

            return buckets.map((b) => ({
                name: b.date, // ex: 2025-09-17
                sales: b.sales,
                orders: b.count,
            }));
        }

        if (tab === 'monthly') {
            // 1월(0) ~ 12월(11)
            const buckets = Array.from({ length: 12 }).map(() => ({ sales: 0, count: 0 }));
            rawData.forEach((item, index) => {
                const d = parseDateSafe(item.time || item.settlementDate || item.createdAt);
                if (!d) {
                    console.warn(`날짜 파싱 실패 (${index}):`, item);
                    return;
                }
                const m = d.month(); // 0..11
                const amt = parseAmount(item.amount);
                buckets[m].sales += amt;
                buckets[m].count += 1;
                console.log(`월간 데이터 추가: ${d.format('YYYY-MM')} -> ${m}월, 금액: ${amt}`); // 디버깅용
            });

            return buckets.map((b, idx) => ({
                name: `${idx + 1}월`,
                sales: b.sales,
                orders: b.count,
            }));
        }

        // yearly : 연도별 집계
        const yearMap = {};
        const yearCountMap = {};

        rawData.forEach((item, index) => {
            const d = parseDateSafe(item.time || item.settlementDate || item.createdAt);
            if (!d) {
                console.warn(`날짜 파싱 실패 (${index}):`, item);
                return;
            }
            const y = d.year();
            const amt = parseAmount(item.amount);

            yearMap[y] = (yearMap[y] || 0) + amt;
            yearCountMap[y] = (yearCountMap[y] || 0) + 1;
            console.log(`연간 데이터 추가: ${y}년, 금액: ${amt}`); // 디버깅용
        });

        // 정렬된 연도 배열
        const years = Object.keys(yearMap).map(Number).sort((a, b) => a - b);
        console.log('연간 집계 결과:', yearMap, '연도 목록:', years); // 디버깅용

        return years.map((y) => ({
            name: `${y}년`,
            sales: yearMap[y],
            orders: yearCountMap[y],
        }));
    };

    const chartData = convertDataForChart(data, activeTab);
    console.log('최종 차트 데이터:', chartData); // 디버깅용

    const getTitle = () => {
        if (activeTab === 'daily') return '주간 매출 추이';
        if (activeTab === 'monthly') return '월간 매출 추이';
        return '연간 매출 추이';
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e1e8ed',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    color: '#2c3e50',
                    fontSize: '14px',
                    minWidth: '120px'
                }}>
                    <p style={{
                        margin: '0 0 8px 0',
                        fontWeight: '600',
                        color: '#333'
                    }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{
                            margin: '4px 0',
                            color: entry.color,
                            fontWeight: '500'
                        }}>
                            {entry.dataKey === 'sales' ? '매출: ' : '주문수: '}
                            <span style={{ fontWeight: '600' }}>
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

                        <Bar
                            yAxisId="left"
                            dataKey="sales"
                            name="매출"
                            fill="#4561DB"
                            fillOpacity={0.6}
                            radius={[4, 4, 0, 0]}
                            barSize={60}
                        />

                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="orders"
                            name="주문수"
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