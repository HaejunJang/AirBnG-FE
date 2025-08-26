import React, { useEffect, useState } from 'react';

import gangnamImg from '../../assets/gangnam.jpg';
import hongdaeImg from '../../assets/hongdae.jpg';
import jamsilImg from '../../assets/jamsil.jpg';

function PopularSection({ onPopularClick }) {
  const [popularList, setPopularList] = useState([]);

  useEffect(() => {
    const dummyList = [
      {
        img: gangnamImg,
        name: "강남역 보관소",
        address: "서울 강남구 강남대로 123",
        lockerId: 1,
      },
      {
        img: hongdaeImg,
        name: "홍대입구역 보관소",
        address: "서울 마포구 양화로 45",
        lockerId: 2,
      },
      {
        img: jamsilImg,
        name: "잠실역 보관소",
        address: "서울 송파구 올림픽로 240",
        lockerId: 3,
      },
    ];
    setPopularList(dummyList);
  }, []);

  return (
    <section className="popular-section">
      <h3>인기 보관 지역</h3>
      <div className="popular-list">
        {popularList.length > 0 ? (
          popularList.map((item, idx) => (
            <div
              className="popular-item"
              key={idx}
              onClick={() => onPopularClick && onPopularClick(item.lockerId)}
              style={{ cursor: 'pointer' }}
            >
              <div className="thumb">
                <img src={item.img} alt={item.name} />
              </div>
              <div>
                <div className="locker-name">{item.name}</div>
                <div className="locker-address">{item.address}</div>
              </div>
            </div>
          ))
        ) : (
          <div>인기 지역 정보를 불러오는 중...</div>
        )}
      </div>
    </section>
  );
}

export default PopularSection;