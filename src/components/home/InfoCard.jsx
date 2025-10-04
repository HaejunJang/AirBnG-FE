import React, { useState } from 'react';
import {useNavigate} from "react-router-dom";

function InfoCard({ locationName }) {
    const navigate = useNavigate();
    const [location, setLocation] = useState("");
    const [jimTypeId, setJimTypeId] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (location) params.append("address", location);
        // params.append("reservationDate", date || new Date().toISOString().split("T")[0]);
        //if (lockerName) params.append("lockerName", lockerName);
        params.append("jimTypeId", jimTypeId);
        navigate(`/page/lockerSearchDetails?${params.toString()}`);
    };

    const getDefaultTimeRange = () => {
        const now = new Date();
        const startHour = now.getHours();
        const endHour = startHour + 2;
        // 24시 넘으면 0시로 처리
        const pad = n => n.toString().padStart(2, '0');
        return `${pad(startHour)}:00~${pad(endHour % 24)}:00`;
    };
    const [time, setTime] = useState(getDefaultTimeRange());


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
            placeholder="예: 마포구"
            onChange={e => setLocation(e.target.value)}
          />
        </div>
        <div className="info-row">
          <label htmlFor="date">날짜</label>
          <div className="date-wrapper">
            <div className="custom-date-display">{date}</div>
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
            {/*<option value="18:00~20:00">(18:00~20:00) 2시간</option>*/}
            {/*<option value="20:00~22:00">(20:00~22:00) 2시간</option>*/}
            {/*<option value="22:00~24:00">(22:00~24:00) 2시간</option>*/}
            <option value={time}>({time}) 2시간</option>
          </select>
        </div>
      </div>
        <button
            className="find-button"
            onClick={handleSearch}
        >
            보관소 찾기
        </button>
    </div>
  );
}

export default InfoCard;