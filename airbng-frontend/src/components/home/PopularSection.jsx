import React from "react";
import { useNavigate } from "react-router-dom";

function PopularSection({ items = [], loading = false, onPopularClick }) {
  const navigate = useNavigate();
  const handleClick = (id) => {
    if (onPopularClick) onPopularClick(id);
    else navigate(`/page/lockers/${id}`);
  };

  return (
    <section className="popular-section">
      <h3>인기 보관 지역</h3>
      {loading ? (
        <div className="popular-loading">불러오는 중...</div>
      ) : (
        <div className="popular-list">
          {items.map((locker) => (
            <div
              className="popular-item"
              key={locker.lockerId}
              onClick={() => handleClick(locker.lockerId)}
              style={{ cursor: "pointer" }}
            >
              <div className="thumb">
                {/* 백엔드 필드명이 url/lockerName/address */}
                <img src={locker.url} alt={locker.lockerName} />
              </div>
              <div>
                <div className="locker-name">{locker.lockerName}</div>
                <div className="locker-address">{locker.address}</div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div>표시할 인기 지역이 없습니다.</div>}
        </div>
      )}
    </section>
  );
}
export default PopularSection;
