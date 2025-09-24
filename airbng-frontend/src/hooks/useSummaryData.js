import { useState, useEffect, useCallback } from 'react';
import { getLockerReviewsByStatus } from '../api/admin/adminApi';

export const useSummaryData = () => {
    const [summaryData, setSummaryData] = useState({
        waiting: { count: 0, content: [] },
        approved: { count: 0, content: [] },
        rejected: { count: 0, content: [] },
    });
    const [loading, setLoading] = useState(false);

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            const [waitingRes, approvedRes, rejectedRes] = await Promise.all([
                getLockerReviewsByStatus('WAITING', 1),
                getLockerReviewsByStatus('APPROVED', 1),
                getLockerReviewsByStatus('REJECTED', 1),
            ]);

            setSummaryData({
                waiting: { count: waitingRes.data.totalElements, content: waitingRes.data.content },
                approved: { count: approvedRes.data.totalElements, content: approvedRes.data.content },
                rejected: { count: rejectedRes.data.totalElements, content: rejectedRes.data.content },
            });
        } catch (error) {
            console.error('요약 데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    // 외부에서 재로드 가능하도록
    const reloadSummary = async () => {
        await fetchSummary();
    };

    return { summaryData, loading, reloadSummary };
};
