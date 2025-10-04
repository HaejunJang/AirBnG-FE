import React, { useState } from 'react';
import { useDropdown } from '../../../hooks/useFilterDropdown';
import '../../../styles/pages/searchFilter.css';

const DateTimeModal = ({
                           showDateModal,
                           showTimeModal,
                           selectedDate,
                           setSelectedDate,
                           selectedStartTime,
                           selectedEndTime,
                           setSelectedStartTime,
                           setSelectedEndTime,
                           onCloseDateModal,
                           onCloseTimeModal
                       }) => {
    const [dateInput, setDateInput] = useState('');
    const { isOpen: showStartDropdown, toggle: toggleStartDropdown } = useDropdown(true);
    const { isOpen: showEndDropdown, toggle: toggleEndDropdown } = useDropdown(true);

    const timeOptions = {
        start: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
        end: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00']
    };

    // 날짜 선택
    const selectDate = () => {
        if (dateInput) {
            const date = new Date(dateInput);
            const formattedDate = date.toLocaleDateString('ko-KR');
            setSelectedDate(formattedDate);
            onCloseDateModal();
        }
    };

    // 시간 선택
    const selectTime = () => {
        onCloseTimeModal();
    };

    const selectTimeOption = (time, type) => {
        if (type === 'start') {
            setSelectedStartTime(time);
        } else {
            setSelectedEndTime(time);
        }
    };

    return (
        <>
            {/* 날짜 선택 모달 */}
            {showDateModal && (
                <div className="modal active">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>날짜 선택</h3>
                            <button className="close-button" onClick={onCloseDateModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <input
                                type="date"
                                className="date-input"
                                value={dateInput}
                                onChange={(e) => setDateInput(e.target.value)}
                            />
                            <button className="confirm-button" onClick={selectDate}>확인</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 시간 선택 모달 */}
            {showTimeModal && (
                <div className="modal active">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>시간 선택</h3>
                            <button className="close-button" onClick={onCloseTimeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="time-selector">
                                {/* 시작 시간 드롭다운 */}
                                <div className="dropdown time-group">
                                    <label>시작 시간</label>
                                    <div className={`custom-dropdown ${showStartDropdown ? 'open' : ''}`}>
                                        <div className="selected" onClick={toggleStartDropdown}>
                                            {selectedStartTime}
                                        </div>
                                        <ul className="dropdown-options">
                                            {timeOptions.start.map((time) => (
                                                <li key={time} onClick={() => selectTimeOption(time, 'start')}>
                                                    {time}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* 종료 시간 드롭다운 */}
                                <div className="dropdown time-group">
                                    <label>종료 시간</label>
                                    <div className={`custom-dropdown ${showEndDropdown ? 'open' : ''}`}>
                                        <div className="selected" onClick={toggleEndDropdown}>
                                            {selectedEndTime}
                                        </div>
                                        <ul className="dropdown-options">
                                            {timeOptions.end.map((time) => (
                                                <li key={time} onClick={() => selectTimeOption(time, 'end')}>
                                                    {time}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <button className="confirm-button" onClick={selectTime}>확인</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DateTimeModal;