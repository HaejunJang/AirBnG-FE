import React from 'react';

const ReservationHeader = () => {
    return (
        <div className="header">
            <button onClick={() => window.history.back()} className="back-button">
                ←
            </button>
            <h1 className="header-title">예약 내역</h1>
        </div>
    );
};

export default ReservationHeader;