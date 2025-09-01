import React, { useRef, useState } from 'react';
import LockerList from './LockerList';
import "../../../styles/pages/bottomSheet.css";
import arrowDownIcon from '../../../assets/arrow-down.svg';

const BottomSheet = ({
                         lockers,
                         isFixed,
                         onToggle,
                         selectedLockerId,
                         onLockerSelect,
                         contextPath
                     }) => {
    const sheetRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currentBagType, setCurrentBagType] = useState(0);

    const typeMap = {
        0: '모든 짐',
        1: '백팩/가방',
        2: '캐리어 소형',
        3: '캐리어 대형',
        4: '박스/큰 짐',
        5: '유모차'
    };

    const handleBagTypeSelect = (id) => {
        setCurrentBagType(Number(id));
        setIsDropdownOpen(false);
    };

    const handleMouseDown = (e) => {
        setStartY(e.clientY);
        setIsDragging(true);
        sheetRef.current?.classList.add("dragging");

        const handleMouseMove = (e) => {
            // 드래그 중 처리 로직
        };

        const handleMouseUp = (e) => {
            if (!isDragging) return;

            const deltaY = e.clientY - startY;
            onToggle(deltaY <= 20);

            setIsDragging(false);
            sheetRef.current?.classList.remove("dragging");
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            ref={sheetRef}
            id="bottomSheet"
            className="bottom-sheet"
            style={{
                transform: isFixed ? "translateX(-50%) translateY(0%)" : "translateX(-50%) translateY(70%)"
            }}
        >
            <div id="sheetHeader" className="sheet-header" onMouseDown={handleMouseDown}>
                <div className="sheet-drag-handle"></div>
            </div>

            <div className="sheet-title">
                <div className="sheet-left">
                    <span>검색 결과&nbsp;</span>
                    <span className="sheet-count">{lockers.length}</span>
                </div>

                <div >
                    <button className="sheet-subtitle" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        <span id="selectedBagType">{typeMap[currentBagType]}</span>
                        <img className="dropdown-down" src={arrowDownIcon} alt="드롭다운"/>
                    </button>

                    {isDropdownOpen && (
                        <div id="bag-dropdown" className="dropdown-menu">
                            {Object.entries(typeMap).map(([id, name]) => (
                                <button
                                    key={id}
                                    onClick={() => handleBagTypeSelect(id)}
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
                    contextPath={contextPath}
                    isSheetFixed={isFixed}
                />
            </div>
        </div>
    );
};

export default BottomSheet;