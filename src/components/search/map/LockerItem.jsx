import React from 'react';
import {useNavigate} from "react-router-dom";
import imgUpload from "../../../assets/img_upload_ic.svg";


const LockerItem = ({ locker, isSelected, onClick }) => {
    const navigate = useNavigate();
    const imageUrl = locker.url || imgUpload;
    const isDisabled = locker.isAvailable === 'NO';

    const handleButtonClick = (e) => {
        if (isSelected) {
            e.stopPropagation();
            navigate(`/page/lockers/${locker.lockerId}`);
        }
    };



    return (
        <div
            className={`storage-item ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <div className="storage-image" style={{ backgroundImage: `url('${imageUrl}')` }}></div>
            <div className="storage-info">
                <div className="storage-name">{locker.lockerName}</div>
                <div className="storage-address">{locker.address}</div>
            </div>
            <button
                className="storage-button"
                onClick={handleButtonClick}
            >
                {isSelected ? '상세보기' : (locker.isAvailable === 'YES' ? '보관가능' : '보관대기')}
            </button>
        </div>
    );
};

export default LockerItem;
