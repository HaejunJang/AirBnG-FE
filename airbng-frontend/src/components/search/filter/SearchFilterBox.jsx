import React, {useEffect, useState} from 'react';
import { useDropdown } from '../../../hooks/useFilterDropdown';
import '../../../styles/pages/searchFilter.css';
import Group2 from '../../../assets/Group 2.svg';
import calendarC from '../../../assets/calendarC.svg';
import bag2 from '../../../assets/bag-2.svg';
import clock from '../../../assets/clock.svg';
import {useNavigate, useSearchParams} from "react-router-dom";

const SearchFilterBox = ({
                             searchQuery,
                             setSearchQuery,
                             selectedDate,
                             selectedBagType,
                             setSelectedBagType,
                             onDateClick,
                             onTimeClick,
                             onSearch
                         }) => {
    //const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isOpen: showBagDropdown, toggle: toggleBagDropdown } = useDropdown(false);

    const jimTypeMap = [
        '모든 짐',
        '백팩/가방',
        '캐리어 소형',
        '캐리어 대형',
        '박스/큰 짐',
        '유아용품'
    ];

    useEffect(() => {
        const jimTypeId = searchParams.get('jimTypeId');
        if (jimTypeId !== null) {
            const typeIndex = parseInt(jimTypeId, 10);
            // jimTypeId가 유효한 범위 내에 있는지 확인
            if (typeIndex >= 0 && typeIndex < jimTypeMap.length) {
                const selectedType = jimTypeMap[typeIndex];
                setSelectedBagType(selectedType);
            }
        }
    }, [searchParams, setSelectedBagType]);

    const selectBagType = (bagType) => {
        setSelectedBagType(bagType);
    };

    const getDefaultTimeRange = () => {
        const now = new Date();
        const startHour = now.getHours();
        const endHour = (startHour + 2) % 24;
        const pad = n => n.toString().padStart(2, '0');
        return {
            start: `${pad(startHour)}:00`,
            end: `${pad(endHour)}:00`
        };
    };

    const [selectedStartTime, setSelectedStartTime] = useState(getDefaultTimeRange().start);
    const [selectedEndTime, setSelectedEndTime] = useState(getDefaultTimeRange().end);

    const today = new Date().toISOString().slice(0, 10);

    return (
        <>
            <div className="search-filter-container">
                {/* 검색 입력창 */}
                <div className="searchFilter-input-wrapper">
                    <img className="searchFilter-icon" src={Group2} alt="검색"/>
                    <input
                        type="text"
                        className="searchFilter-input"
                        placeholder="내 근처 짐 맡길 곳 검색하기"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <hr className="filter-divider"/>

                {/* 날짜 및 짐 타입 필터 */}
                <div className="filter-row">
                    <div className="filter-item" onClick={onDateClick}>
                        <img className="filter-icon" src={calendarC} alt="캘린더"/>
                        <span>{selectedDate || today}</span>
                    </div>

                    {/* 짐 타입 드롭다운 */}
                    <div className="search-dropdown-wrapper">
                        <div className="filter-item bag-filter" onClick={toggleBagDropdown}>
                            <img className="filter-icon" src={bag2} alt="짐"/>
                            <span>{selectedBagType}</span>
                        </div>

                        <div className={`dropdown ${showBagDropdown ? '' : 'bag-dropdown-hidden'}`}>
                            <div onClick={toggleBagDropdown}>
                                {jimTypeMap.map((type) => (
                                    <div key={type} className="dropdown-option" onClick={() => selectBagType(type)}>
                                        {type}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="filter-divider"/>

                {/* 시간 필터 */}
                <div className="filter-item time-filter" onClick={onTimeClick}>
                    <img className="filter-icon" src={clock} alt="시계"/>
                    <span>
                        {selectedStartTime} ~ {selectedEndTime}
                    </span>
                </div>
            </div>

            {/* 검색 버튼 */}
            <div className="searchFilter-button-container">
                <button className="searchFilter-button" onClick={onSearch}>
                    검색
                </button>
            </div>
        </>
    );
};

export default SearchFilterBox;