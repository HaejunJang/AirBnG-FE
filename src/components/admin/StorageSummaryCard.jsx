import React from 'react';
import styles from '../../styles/admin/pages/StorageSummaryCard.module.css';

const StorageSummaryCard = ({
                                summaryData,
                                title = "보관소 상태",
                                maxItemsPerSection = 5,
                                onItemClick = null
                            }) => {
    const statusConfig = {
        waiting: {
            label: '대기',
            colorClass: styles.textOrange,
            itemClass: styles.summaryPending
        },
        approved: {
            label: '승인',
            colorClass: styles.textGreen,
            itemClass: styles.summaryApproved
        },
        rejected: {
            label: '반려',
            colorClass: styles.textRed,
            itemClass: styles.summaryRejected
        }
    };

    // 영어 상태를 한국어로 변환하는 함수
    const getKoreanStatus = (englishStatus) => {
        const statusMap = {
            'waiting': '대기',
            'approved': '승인',
            'rejected': '반려'
        };
        return statusMap[englishStatus] || '대기';
    };

    const handleItemClick = (item, statusKey) => {
        if (onItemClick) {
            // 한국어 상태로 변환해서 전달
            const koreanStatus = getKoreanStatus(statusKey);
            onItemClick(item, koreanStatus);
        }
    };

    return (
        <div className={styles.contentCard}>
            <h3 className={styles.subTitle}>{title}</h3>

            <div className={styles.summaryGrid}>
                {Object.entries(statusConfig).map(([statusKey, config]) => {
                    const statusData = summaryData[statusKey] || { count: 0, content: [] };

                    return (
                        <div key={statusKey} className={styles.summarySection}>
                            <div className={styles.summaryHeader}>
                                <h4 className={`${styles.summaryTitle} ${config.colorClass}`}>
                                    {config.label}
                                </h4>
                                <span className={styles.summaryCount}>
                                    {statusData.count}개
                                </span>
                            </div>

                            <div className={styles.summaryList}>
                                {(statusData.content || [])
                                    .slice(0, maxItemsPerSection)
                                    .map((item) => (
                                        <div
                                            key={item.lockerReviewId}
                                            className={`${styles.summaryItem} ${config.itemClass} ${
                                                onItemClick ? styles.clickableItem : ''
                                            }`}
                                            onClick={() => handleItemClick(item, statusKey)}
                                        >
                                            <span className={styles.summaryStorageName}>
                                                {item.lockerName}
                                            </span>
                                            <span className={styles.summaryOwnerName}>
                                                {item.memberName}
                                            </span>
                                        </div>
                                    ))
                                }
                                {statusData.content && statusData.content.length === 0 && (
                                    <div className={styles.emptyMessage}>
                                        {config.label} 상태의 보관소가 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StorageSummaryCard;