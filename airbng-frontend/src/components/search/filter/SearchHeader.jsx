import React from 'react';
import "../../../styles/pages/searchFilter.css";
import arrowLeft from '../../../assets/arrow-left.svg';

const SearchHeader = () => {
    const handleBackClick = () => {
        window.history.back();
    };

    return (
        <header className="filter-header">
            <button className="back-button" onClick={handleBackClick}>
                <img className="search-back-icon" src={arrowLeft} alt="뒤로가기" />
            </button>
            <h1 className="header-title">검색</h1>
        </header>
    );
};

export default SearchHeader;