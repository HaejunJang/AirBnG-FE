import React from 'react';
import FilterSection from "./FilterSection";

const ToggleSection = ({ currentIsDropper, changeToggle, loading }) => {
    return (
        <div className="toggle-section">
            <div className="toggle-container">
                <div
                    className={`toggle-option ${currentIsDropper ? 'active' : ''}`}
                    onClick={() => !loading && changeToggle(true)}
                >
                    맡긴 내역
                </div>
                <div
                    className={`toggle-option ${!currentIsDropper ? 'active' : ''}`}
                    onClick={() => !loading && changeToggle(false)}
                >
                    맡아준 내역
                </div>
            </div>
        </div>
    );
};

export default ToggleSection;