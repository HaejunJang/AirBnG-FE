import React from 'react';

const EmptyAndLoading = ({ showEmpty, loading }) => {
    return (
        <>
            {/* 빈 상태 */}
            {showEmpty && (
                <div className="empty-state">
                    <p>예약 내역이 없습니다.</p>
                </div>
            )}

            {/* 로딩 상태 */}
            {loading && (
                <div className="loading">
                    <p>로딩 중...</p>
                </div>
            )}

        </>
    );
};

export default EmptyAndLoading;