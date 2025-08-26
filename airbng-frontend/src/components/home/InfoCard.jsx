import React, { useState } from 'react';

function InfoCard({ locationName }) {
  const [location, setLocation] = useState(locationName || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00~20:00');
  const [isLoggedIn] = useState(false);

  const handleFindClick = () => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다. 로그인 후 이용해주세요.");
      return;
    }
  };

  return (
    <div className="info-card">
      <div className="info-row-group">
        <div className="info-row">
          <label htmlFor="location">장소</label>
          <input
            type="text"
            id="location"
            name="location"
            value={location}
            placeholder="예: 강남구"
            onChange={e => setLocation(e.target.value)}
          />
        </div>
        <div className="info-row">
          <label htmlFor="date">날짜</label>
          <div className="date-wrapper">
            <div className="custom-date-display">{date || '연도-월-일'}</div>
            <input
              type="date"
              id="date"
              name="date"
              className="real-date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>
        <div className="info-row">
          <label htmlFor="time">시간</label>
          <select id="time" name="time" value={time} onChange={e => setTime(e.target.value)}>
            <option value="18:00~20:00">(18:00~20:00) 2시간</option>
            <option value="20:00~22:00">(20:00~22:00) 2시간</option>
            <option value="22:00~24:00">(22:00~24:00) 2시간</option>
          </select>
        </div>
      </div>
      <button className="find-button" onClick={handleFindClick}>보관소 찾기</button>
    </div>
  );
}

export default InfoCard;