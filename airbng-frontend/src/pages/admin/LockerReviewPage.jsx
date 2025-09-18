import React, { useState, useEffect } from 'react';
import { SlArrowLeft } from "react-icons/sl";
import StorageDetailModal from './LockerReviewDetailsPage';
import {
    getLockerReviewsByStatus,
    getLockerReviewDetail,
} from '../../api/admin/adminApi';

import styles from '../../styles/admin/pages/LockerReview.module.css';

const StorageReviewContent = () => {
    const [selectedStatus, setSelectedStatus] = useState('대기중');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [showDetailView, setShowDetailView] = useState(false);
    const [showStorageDetail, setShowStorageDetail] = useState(false);
    const [selectedStorage, setSelectedStorage] = useState(null);

    // API 데이터 상태
    const [lockerData, setLockerData] = useState({
        waiting: { content: [], totalElements: 0, totalPages: 0 },
        approved: { content: [], totalElements: 0, totalPages: 0 },
        rejected: { content: [], totalElements: 0, totalPages: 0 }
    });
    const [summaryData, setSummaryData] = useState({
        waiting: { count: 0, content: [] },
        approved: { count: 0, content: [] },
        rejected: { count: 0, content: [] }
    });
    const [loading, setLoading] = useState(false);

    // 한글 상태를 영문 상태로 변환
    const getEnglishStatus = (koreanStatus) => {
        switch(koreanStatus) {
            case '대기중': return 'WAITING';
            case '승인됨': return 'APPROVED';
            case '반려됨': return 'REJECTED';
            default: return 'WAITING';
        }
    };

    // 초기 요약 데이터 로드
    useEffect(() => {
        const loadSummaryData = async () => {
            try {
                setLoading(true);
                const [waitingRes, approvedRes, rejectedRes] = await Promise.all([
                    getLockerReviewsByStatus('WAITING', 1),
                    getLockerReviewsByStatus('APPROVED', 1),
                    getLockerReviewsByStatus('REJECTED', 1)
                ]);

                setSummaryData({
                    waiting: {
                        count: waitingRes.data.totalElements,
                        content: waitingRes.data.content
                    },
                    approved: {
                        count: approvedRes.data.totalElements,
                        content: approvedRes.data.content
                    },
                    rejected: {
                        count: rejectedRes.data.totalElements,
                        content: rejectedRes.data.content
                    }
                });
            } catch (error) {
                console.error('요약 데이터 로드 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSummaryData();
    }, []);

    // 상태별 데이터 로드
    useEffect(() => {
        if (showDetailView) {
            loadStatusData();
        }
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

    const getCurrentPageData = () => {
        return getCurrentData().content || [];
    };

    const getTotalPages = () => {
        return getCurrentData().totalPages || 0;
    };

    const getStatusInfo = () => {
        return {
            waiting: { count: summaryData.waiting.count, color: 'textOrange' },
            approved: { count: summaryData.approved.count, color: 'textGreen' },
            rejected: { count: summaryData.rejected.count, color: 'textRed' }
        };
    };

    // 보관소 상세 화면
    if (showStorageDetail && selectedStorage) {
        return (
            <div>
                <div className={styles.backButtonContainer}>
                    <button
                        onClick={() => setShowStorageDetail(false)}
                        className={styles.backButton}
                    >
                        <SlArrowLeft size={20} />
                        뒤로가기
                    </button>
                </div>
                <StorageDetailModal
                    storage={selectedStorage}
                    status={selectedStatus}
                    onRefresh={loadStatusData}
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
                        <div
                            className={`${styles.statCard} ${styles.clickableCard}`}
                            onClick={() => handleStatusClick('대기중')}
                        >
                            <h3 className={styles.statLabel}>대기중</h3>
                            <p className={`${styles.statValue} ${styles.textOrange}`}>
                                {loading ? '...' : statusInfo.waiting.count}
                            </p>
                        </div>
                        <div
                            className={`${styles.statCard} ${styles.clickableCard}`}
                            onClick={() => handleStatusClick('승인됨')}
                        >
                            <h3 className={styles.statLabel}>승인됨</h3>
                            <p className={`${styles.statValue} ${styles.textGreen}`}>
                                {loading ? '...' : statusInfo.approved.count}
                            </p>
                        </div>
                        <div
                            className={`${styles.statCard} ${styles.clickableCard}`}
                            onClick={() => handleStatusClick('반려됨')}
                        >
                            <h3 className={styles.statLabel}>반려됨</h3>
                            <p className={`${styles.statValue} ${styles.textRed}`}>
                                {loading ? '...' : statusInfo.rejected.count}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 상세 화면 (숫자 클릭 후)
    return (
        <div>
            <div className={styles.backButtonContainer}>
                <button
                    onClick={() => setShowDetailView(false)}
                    className={styles.backButton}
                >
                    <SlArrowLeft size={20} />
                    뒤로가기
                </button>
            </div>

            {/* 상단: 상세 리스트 */}
            <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.subTitle}>
                        {selectedStatus} 보관소 목록
                    </h3>
                    <span className={styles.countBadge}>
                        총 {getCurrentData().totalElements}개
                    </span>
                </div>

                {/* 로딩 표시 */}
                {loading ? (
                    <div className={styles.loadingContainer}>
                        <p>데이터를 불러오는 중...</p>
                    </div>
                ) : (
                    <>
                        {/* 리스트 */}
                        <div className={styles.storageDetailList}>
                            {getCurrentPageData().map((storage) => (
                                <div
                                    key={storage.lockerReviewId}
                                    className={styles.storageDetailItem}
                                    onClick={() => handleStorageClick(storage)}
                                >
                                    <div className={styles.storageDetailHeader}>
                                        <h4 className={styles.storageName}>{storage.lockerName}</h4>
                                        <span className={`${styles.statusBadge} ${
                                            selectedStatus === '대기중' ? styles.statusPending :
                                                selectedStatus === '승인됨' ? styles.statusApproved :
                                                    styles.statusRejected
                                        }`}>
                                            {selectedStatus}
                                        </span>
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
                                        className={`${styles.pageButton} ${
                                            currentPage === i + 1 ? styles.pageButtonActive : ''
                                        }`}
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
                    </>
                )}
            </div>

            {/* 하단: 카테고리별 요약 */}
            <div className={styles.contentCard}>
                <h3 className={styles.subTitle}>카테고리별 요약</h3>

                <div className={styles.summaryGrid}>
                    {/* 대기중 */}
                    <div className={styles.summarySection}>
                        <div className={styles.summaryHeader}>
                            <h4 className={`${styles.summaryTitle} ${styles.textOrange}`}>대기중</h4>
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
                            <h4 className={`${styles.summaryTitle} ${styles.textGreen}`}>승인됨</h4>
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
                            <h4 className={`${styles.summaryTitle} ${styles.textRed}`}>반려됨</h4>
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
