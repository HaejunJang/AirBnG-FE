import React from 'react';
import { PERIOD_OPTIONS } from '../../utils/reservation/reservationUtils';


const FilterSection = ({
                           currentStates,
                           currentPeriod,
                           dropdownOpen,
                           toggleDropdown,
                           selectPeriod,
                           closeDropdown,
                           loading
                       }) => {
    const shouldShowFilter = ['COMPLETED', 'CANCELLED'].some(s => currentStates.includes(s));

    if (!shouldShowFilter) return null;

    const handleSelectPeriod = (period) => {
        selectPeriod(period);
        closeDropdown();
    };

    return (
        <div className="filter-section show">
            <div className="period-dropdown">
                <button
                    className={`dropdown-btn ${dropdownOpen ? 'open' : ''}`}
                    onClick={toggleDropdown}
                    disabled={loading}
                >
                    <span>{PERIOD_OPTIONS.find(p => p.value === currentPeriod)?.label || '전체'}</span>
                    <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                </button>
                {dropdownOpen && (
                    <div className="dropdown-menu show">
                        {PERIOD_OPTIONS.map(option => (
                            <div
                                key={option.value}
                                className="dropdown-item"
                                onClick={() => handleSelectPeriod(option.value)}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterSection;