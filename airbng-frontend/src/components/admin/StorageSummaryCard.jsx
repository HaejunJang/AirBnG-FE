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

    const handleItemClick = (item, status) => {
        if (onItemClick) {
            onItemClick(item, status);
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