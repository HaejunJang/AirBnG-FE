import React from 'react';

const ReservationTabs = ({ currentStates, changeTab, loading }) => {
    return (
        <div className="tab-container">
            <div className="tabs">
                <button
                    className={`tab ${currentStates.includes('CONFIRMED') && currentStates.includes('PENDING') ? 'active' : ''}`}
                    onClick={() => changeTab(['CONFIRMED', 'PENDING'])}
                    disabled={loading}
                >
                    이용전
                </button>
                <button
                    className={`tab ${currentStates.includes('COMPLETED') ? 'active' : ''}`}
                    onClick={() => changeTab(['COMPLETED'])}
                    disabled={loading}
                >
                    이용후
                </button>
                <button
                    className={`tab ${currentStates.includes('CANCELLED') ? 'active' : ''}`}
                    onClick={() => changeTab(['CANCELLED'])}
                    disabled={loading}
                >
                    취소됨
                </button>
            </div>
        </div>
    );
};

export default ReservationTabs;