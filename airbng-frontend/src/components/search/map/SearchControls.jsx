import React, { useState } from 'react';
import backIcon from '../../../assets/arrow-back.svg';
import searchIcon from '../../../assets/Group 2.svg';
import "../../../styles/pages/search.css";
import {useNavigate} from "react-router-dom";


const SearchControls = ({ address, reservationDate, jimTypeId, onBagTypeChange, currentBagType }) => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const typeMap = {
        0: '모든 짐',
        1: '백팩/가방',
        2: '캐리어 소형',
        3: '캐리어 대형',
        4: '박스/큰 짐',
        5: '유모차'
    };

    const handleBagTypeSelect = (jimTypeId) => {
        setIsDropdownOpen(false);
        onBagTypeChange(jimTypeId);
    };

    return (
        <div className="search-top-bar">
            <img
                className="back-icon"
                src={backIcon}
                alt="뒤로가기"
                onClick={() => navigate(`/page/home`)}
            />
            {/* 검색바 */}
            <div className="search-container">
                <form
                    className="search-form"
                    action={`/search`}
                    method="get"
                >
                    <input
                        className="search-input"
                        type="text"
                        name="query"
                        id="searchInput"
                        placeholder={address}
                        required
                    />
                    <img
                        className="search-button"
                        src={searchIcon}
                        alt="검색"
                    />
                </form>
            </div>
        </div>
    );
};

export default SearchControls;