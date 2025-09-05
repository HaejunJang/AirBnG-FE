import React from 'react';
import LockerItem from './LockerItem';
import dangerIcon from '../../../assets/danger.svg';
import "../../../styles/pages/bottomSheet.css";

const LockerList = ({
                        lockers,
                        selectedLockerId,
                        onLockerSelect,
                        isSheetFixed
                    }) => {
    const handleLockerClick = (locker) => {
        if (locker.isAvailable === 'NO' || !isSheetFixed) return;
        onLockerSelect(locker.lockerId);
    };

    if (lockers.length === 0) {
        return (
            <div id="lockerList">
                <div className="no-result-wrapper">
                    <img className="search-warning" src={dangerIcon} alt="검색결과없음" />
                    <p className="no-result-main">검색 결과가 없습니다</p>
                    <p className="no-result-sub">다른 위치나 키워드로 다시 시도해보세요!</p>
                </div>
            </div>
        );
    }

    return (
        <div id="lockerList">
            {lockers.map((locker) => (
                <LockerItem
                    key={locker.lockerId}
                    locker={locker}
                    isSelected={selectedLockerId === locker.lockerId}
                    onClick={() => handleLockerClick(locker)}
                />
            ))}
        </div>
    );
};

export default LockerList;