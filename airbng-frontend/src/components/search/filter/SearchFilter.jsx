import React from 'react';
import { useSearchFilter } from '../../../hooks/useSearchFilter';
import SearchHeader from './SearchHeader';
import SearchFilterBox from './SearchFilterBox';
import SearchRanking from './SearchRanking';
import DateTimeModal from './DateTimeModal';
import '../../../styles/pages/searchFilter.css';

const SearchFilter = ({ jimTypeId = '모든 짐' }) => {
    const {
        searchQuery,
        selectedDate,
        selectedBagType,
        selectedStartTime,
        selectedEndTime,
        showDateModal,
        showTimeModal,
        searchResults,
        showResults,

        // 상태 업데이터
        setSearchQuery,
        setSelectedDate,
        setSelectedBagType,
        setSelectedStartTime,
        setSelectedEndTime,

        // 액션 핸들러
        handleSearch,
        handleRankingClick,
        openDateModal,
        closeDateModal,
        openTimeModal,
        closeTimeModal,
    } = useSearchFilter(jimTypeId);

    return (
        <div>
            <SearchHeader />

            <SearchFilterBox
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedDate={selectedDate}
                selectedBagType={selectedBagType}
                setSelectedBagType={setSelectedBagType}
                selectedStartTime={selectedStartTime}
                selectedEndTime={selectedEndTime}
                onDateClick={openDateModal}
                onTimeClick={openTimeModal}
                onSearch={handleSearch}
            />

            <SearchRanking onRankingClick={handleRankingClick} />

            {/* 검색 결과 표시 */}
            {showResults && (
                <div className="search-results">
                    <h3>검색 결과</h3>
                    <div className="results-container">
                        {searchResults.map((locker) => (
                            <div key={locker.id} className="locker-item">
                                <p>{locker.name}</p>
                                <p>짐 타입: {locker.jimTypeName}</p>
                                <p>주소: {locker.address}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <DateTimeModal
                showDateModal={showDateModal}
                showTimeModal={showTimeModal}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedStartTime={selectedStartTime}
                selectedEndTime={selectedEndTime}
                setSelectedStartTime={setSelectedStartTime}
                setSelectedEndTime={setSelectedEndTime}
                onCloseDateModal={closeDateModal}
                onCloseTimeModal={closeTimeModal}
            />
        </div>
    );
};

export default SearchFilter;
