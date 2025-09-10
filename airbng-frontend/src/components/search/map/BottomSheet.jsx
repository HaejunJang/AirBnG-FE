import React, {useEffect, useRef, useState} from 'react';
import LockerList from './LockerList';
import "../../../styles/pages/bottomSheet.css";
import arrowDownIcon from '../../../assets/arrow-down.svg';

const BottomSheet = ({
                         lockers,
                         isFixed,
                         onToggle,
                         selectedLockerId,
                         onLockerSelect,
                         currentJimTypeId,
                         onJimTypeChange
                     }) => {
    const sheetRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currentBagType, setCurrentBagType] = useState(0);

    const handleBagTypeSelect = (id, e) => {
        e.stopPropagation();
        const numericId = Number(id);
        setCurrentBagType(numericId);
        setIsDropdownOpen(false);
        onJimTypeChange(numericId);
    };

    useEffect(() => {
        setCurrentBagType(Number(currentJimTypeId));
    }, [currentJimTypeId]);

    const typeMap = {
        0: '모든 짐',
        1: '백팩/가방',
        2: '캐리어 소형',
        3: '캐리어 대형',
        4: '박스/큰 짐',
        5: '유모차'
    };

    const handleClick = () => {
        setIsOpen((prev) => !prev);
    };

    return (
        <div
            ref={sheetRef}
            id="bottomSheet"
            className={`bottom-sheet ${isOpen ? "fixed" : ""}`}
        >
            <div id="sheetHeader" className="sheet-header" onClick={handleClick}>
                <div className="sheet-drag-handle"></div>
            </div>

            <div className="sheet-title">
                <div className="sheet-left">
                    <span>검색 결과&nbsp;</span>
                    <span className="sheet-count">{lockers.length}</span>
                </div>

                <div className="sheet-right">
                    <button className="sheet-subtitle" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        <span id="selectedBagType">{typeMap[currentBagType]}</span>
                        <img className="dropdown-down" src={arrowDownIcon} alt="드롭다운"/>
                    </button>

                    {isDropdownOpen && (
                        <div id="bag-dropdown" className="sheet-dropdown-menu">
                            {Object.entries(typeMap).map(([id, name]) => (
                                <button
                                    key={id}
                                    className={`sheet-dropdown-option ${Number(id) === currentBagType ? 'selected' : ''}`}
                                    onClick={(e) => handleBagTypeSelect(id, e)}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="sheet-content">
                <LockerList
                    lockers={lockers}
                    selectedLockerId={selectedLockerId}
                    onLockerSelect={onLockerSelect}
                    isSheetFixed={isFixed}
                />
            </div>
        </div>
    );
};

export default BottomSheet;