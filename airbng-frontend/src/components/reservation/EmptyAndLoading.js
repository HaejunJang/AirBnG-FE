import React from 'react';

const EmptyAndLoading = ({ data, loading }) => {
    // 데이터가 없고 로딩이 끝났을 때만 빈 상태
    const isEmpty = !loading && (!data || data.length === 0);

    // 예약 내역이 있으면 loading도 표시하지 않음
    const shouldShowLoading = loading && (!data || data.length === 0);

    return (
        <>
            {shouldShowLoading && (
                <div className="loading">
                    <p>로딩 중...</p>
                </div>
            )}

            {isEmpty && (
                <div className="empty-state">
                    <p>예약 내역이 없습니다.</p>
                </div>
            )}
        </>
    );
};

export default EmptyAndLoading;
