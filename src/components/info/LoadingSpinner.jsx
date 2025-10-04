import React from 'react';
import info from '../../styles/pages/myInfo.module.css';

const LoadingSpinner = ({ message = '정보를 불러오는 중...', isVisible = false }) => {
    if (!isVisible) return null;

    return (
        <div className={info.loadingContainer}>
            <div className={info.loadingSpinner}></div>
            <p>{message}</p>
        </div>
    );
};

export default LoadingSpinner;