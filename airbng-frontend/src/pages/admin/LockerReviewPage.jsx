import React, { useState, useEffect } from 'react';
import { FiMoreVertical } from 'react-icons/fi';
import StorageDetailModal from './LockerReviewDetailsPage';
import { getLockerReviewsByStatus, getLockerReviewDetail } from '../../api/admin/adminApi';
import { useSummaryData } from '../../hooks/useSummaryData';
import styles from '../../styles/admin/pages/LockerReview.module.css';

const StorageReviewContent = () => {
    const [selectedStatus, setSelectedStatus] = useState('대기');
    const [currentPage, setCurrentPage] = useState(1);
    const [showDetailView, setShowDetailView] = useState(false);
    const [showStorageDetail, setShowStorageDetail] = useState(false);
    const [selectedStorage, setSelectedStorage] = useState(null);

    const { summaryData, loading: summaryLoading, reloadSummary } = useSummaryData();
    const [lockerData, setLockerData] = useState({
        waiting: { content: [], totalElements: 0, totalPages: 0 },
        approved: { content: [], totalElements: 0, totalPages: 0 },
        rejected: { content: [], totalElements: 0, totalPages: 0 },
    });
    const [loading, setLoading] = useState(false);

    const getEnglishStatus = (koreanStatus) => {
        switch (koreanStatus) {
            case '대기': return 'WAITING';
            case '승인': return 'APPROVED';
            case '반려': return 'REJECTED';
            default: return 'WAITING';
        }
    };

    // 상태별 데이터 로드
    useEffect(() => {
        if (showDetailView) loadStatusData();
    }, [selectedStatus, currentPage, showDetailView]);

    const loadStatusData = async () => {
        try {
            setLoading(true);
            const englishStatus = getEnglishStatus(selectedStatus);
            const response = await getLockerReviewsByStatus(englishStatus, currentPage);

            setLockerData(prev => ({
                ...prev,
                [englishStatus.toLowerCase()]: response.data
            }));
        } catch (error) {
            console.error('상태별 데이터 로드 실패:', error);
            alert('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusClick = (status) => {
        setSelectedStatus(status);
        setCurrentPage(1);
        setShowDetailView(true);
        setShowStorageDetail(false);
    };

    const handleStorageClick = async (storage) => {
        try {
            setLoading(true);
            const response = await getLockerReviewDetail(storage.lockerReviewId);
            setSelectedStorage(response.data);
            setShowStorageDetail(true);
        } catch (error) {
            console.error('보관소 상세 정보를 불러오는 중 오류 발생:', error);
            alert('보관소 상세 정보를 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentData = () => {
        const status = getEnglishStatus(selectedStatus).toLowerCase();
        return lockerData[status] || { content: [], totalElements: 0, totalPages: 0 };
    };

    const getCurrentPageData = () => getCurrentData().content || [];
    const getTotalPages = () => getCurrentData().totalPages || 0;

    const getStatusInfo = () => ({
        '대기': { count: summaryData.waiting.count, color: styles.textOrange },
        '승인': { count: summaryData.approved.count, color: styles.textGreen },
        '반려': { count: summaryData.rejected.count, color: styles.textRed }
    });

    // 보관소 상세 화면
    if (showStorageDetail && selectedStorage) {
        return (
            <div>
                <div className={styles.backButtonContainer}>
                    <button
                        onClick={async () => {
                            setShowStorageDetail(false);
                            setShowDetailView(true);
                            setCurrentPage(1);
                            await loadStatusData();
                            await reloadSummary();
                        }}
                        className={styles.squareButton}
                    >
                        <FiMoreVertical />
                        목록
                    </button>
                </div>

                <StorageDetailModal
                    storage={selectedStorage}
                    status={selectedStatus}
                    onRefresh={loadStatusData}
                    onClose={async () => {
                        setShowStorageDetail(false);
                        setShowDetailView(true);
                        await loadStatusData();
                        await reloadSummary();
                    }}
                />
            </div>
        );
    }

    // 메인 화면 (숫자 클릭 전)
    if (!showDetailView) {
        const statusInfo = getStatusInfo();
        return (
            <div className={styles.contentCard}>
                <h2 className={styles.contentTitle}>보관소 심사</h2>
                <div className={styles.textGray}>
                    <p>보관소 승인 및 심사 관리 페이지입니다.</p>
                    <p>메뉴를 클릭하면 해당 페이지로 이동합니다.</p>
                    <div className={styles.statsGrid}>
                        {['대기', '승인', '반려'].map(status => (
                            <div
                                key={status}
                                className={`${styles.statCard} ${styles.clickableCard}`}
                                onClick={() => handleStatusClick(status)}
                            >
                                <h3 className={styles.statLabel}>{status}</h3>
                                <p className={`${styles.statValue} ${statusInfo[status].color}`}>
                                    {summaryLoading ? '...' : statusInfo[status].count}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 상세 리스트 화면 (숫자 클릭 후)
    return (
        <div>
            <div className={styles.backButtonContainer}>
                <button
                    onClick={async () => {
                        setShowDetailView(false);
                        setShowStorageDetail(false);
                        setCurrentPage(1);
                        await reloadSummary();
                        await loadStatusData();
                    }}
                    className={styles.squareButton}
                >
                    <FiMoreVertical />
                    목록
                </button>
            </div>

            {/* 상단: 상세 리스트 */}
            <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.subTitle}>{selectedStatus} 보관소 목록</h3>
                    <span className={styles.countBadge}>
                        총 {getCurrentData().totalElements}개
                    </span>
                </div>

                {loading ? (
                    <div className={styles.loadingContainer}>
                        <p>데이터를 불러오는 중...</p>
                    </div>
                ) : (
                    <div className={styles.storageDetailList}>
                        {getCurrentPageData().map(storage => (
                            <div
                                key={storage.lockerReviewId}
                                className={styles.storageDetailItem}
                                onClick={() => handleStorageClick(storage)}
                            >
                                <div className={styles.storageDetailHeader}>
                                    <h4 className={styles.storageName}>{storage.lockerName}</h4>
                                    <span className={`${styles.statusBadge} ${
                                        selectedStatus === '대기' ? styles.statusPending :
                                            selectedStatus === '승인' ? styles.statusApproved :
                                                styles.statusRejected
                                    }`}>{selectedStatus}</span>
                                </div>
                                <div className={styles.storageDetailInfo}>
                                    <p>소유자: {storage.memberName}</p>
                                    <p>위치: {storage.address}</p>
                                    <p className={styles.dateText}>
                                        신청일: {new Date(storage.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 페이지네이션 */}
                {getTotalPages() > 1 && (
                    <div className={styles.pagination}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`${styles.pageButton} ${currentPage === 1 ? styles.disabled : ''}`}
                        >
                            이전
                        </button>

                        {[...Array(getTotalPages())].map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`${styles.pageButton} ${currentPage === i + 1 ? styles.pageButtonActive : ''}`}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages()))}
                            disabled={currentPage === getTotalPages()}
                            className={`${styles.pageButton} ${currentPage === getTotalPages() ? styles.disabled : ''}`}
                        >
                            다음
                        </button>
                    </div>
                )}
            </div>

            {/* 하단: 카테고리별 요약 */}
            <div className={styles.contentCard}>
                <h3 className={styles.subTitle}>보관소 상태</h3>

                <div className={styles.summaryGrid}>
                    {/* 대기중 */}
                    <div className={styles.summarySection}>
                        <div className={styles.summaryHeader}>
                            <h4 className={`${styles.summaryTitle} ${styles.textOrange}`}>대기</h4>
                            <span className={styles.summaryCount}>{summaryData.waiting.count}개</span>
                        </div>
                        <div className={styles.summaryList}>
                            {(summaryData.waiting.content ?? []).slice(0, 5).map((storage) => (
                                <div key={storage.lockerReviewId} className={`${styles.summaryItem} ${styles.summaryPending}`}>
                                    <span className={styles.summaryStorageName}>{storage.lockerName}</span>
                                    <span className={styles.summaryOwnerName}>{storage.memberName}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 승인됨 */}
                    <div className={styles.summarySection}>
                        <div className={styles.summaryHeader}>
                            <h4 className={`${styles.summaryTitle} ${styles.textGreen}`}>승인</h4>
                            <span className={styles.summaryCount}>{summaryData.approved.count}개</span>
                        </div>
                        <div className={styles.summaryList}>
                            {(summaryData.approved.content ?? []).slice(0, 5).map((storage) => (
                                <div key={storage.lockerReviewId} className={`${styles.summaryItem} ${styles.summaryApproved}`}>
                                    <span className={styles.summaryStorageName}>{storage.lockerName}</span>
                                    <span className={styles.summaryOwnerName}>{storage.memberName}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 반려됨 */}
                    <div className={styles.summarySection}>
                        <div className={styles.summaryHeader}>
                            <h4 className={`${styles.summaryTitle} ${styles.textRed}`}>반려</h4>
                            <span className={styles.summaryCount}>{summaryData.rejected.count}개</span>
                        </div>
                        <div className={styles.summaryList}>
                            {(summaryData.rejected.content ?? []).slice(0, 5).map((storage) => (
                                <div key={storage.lockerReviewId} className={`${styles.summaryItem} ${styles.summaryRejected}`}>
                                    <span className={styles.summaryStorageName}>{storage.lockerName}</span>
                                    <span className={styles.summaryOwnerName}>{storage.memberName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StorageReviewContent;