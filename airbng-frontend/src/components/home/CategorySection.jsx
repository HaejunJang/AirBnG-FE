import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import backpackImg from "../../assets/backpack_img.svg";
import carrierImg from "../../assets/carrier_img.svg";
import boxImg from "../../assets/box_img.svg";
import strollerImg from "../../assets/stroller_img.svg";

const categories = [
  { img: backpackImg, label: "백팩/가방",   price: "시간당 2,000원부터" }, // jimTypeId 1
  { img: carrierImg,  label: "캐리어",      price: "시간당 2,500원부터" }, // 선택 모달 → 2(소형) / 3(대형)
  { img: boxImg,      label: "박스/큰 짐",  price: "시간당 4,000원부터" }, // jimTypeId 4
  { img: strollerImg, label: "유모차",      price: "시간당 5,000원부터" }, // jimTypeId 5
];

const NORMAL_JIM_MAP = { 0: 1, 2: 4, 3: 5 }; // 인덱스 → jimTypeId (캐리어는 모달로 처리)

function CategorySection({ onCategoryClick, className = "" }) {
  const navigate = useNavigate();
  const { isLoggedIn, ready } = useAuth();

  const [showCarrierModal, setShowCarrierModal] = useState(false);

  const goToJimType = useCallback(
    (jimTypeId) => {
      const target = `/page/lockerSearch?jimTypeId=${jimTypeId}`;
      if (!ready) return; // AuthContext 준비 전 클릭 무시

      // if (!isLoggedIn) {
      //   alert("로그인이 필요합니다. 로그인 후 이용해주세요.");
      //   navigate(`/page/login?redirect=${encodeURIComponent(target)}`);
      //   return;
      // }
      navigate(target);
    }, [ready, navigate]
  );

  const handleCardActivate = useCallback(
    (idx) => {
      // 외부 콜백(있다면)도 호출 — 분석/트래킹용
      if (onCategoryClick) onCategoryClick(idx);

      if (idx === 1) {
        // 캐리어: 소/대 선택 모달
        setShowCarrierModal(true);
        return;
      }
      const jimTypeId = NORMAL_JIM_MAP[idx];
      if (jimTypeId) goToJimType(jimTypeId);
    },
    [onCategoryClick, goToJimType]
  );

  const handleKeyDown = (e, idx) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardActivate(idx);
    }
  };

  const chooseCarrier = (size /* 'small'|'large' */) => {
    const id = size === "small" ? 2 : 3; // 캐리어 소형=2, 대형=3
    setShowCarrierModal(false);
    goToJimType(id);
  };

  return (
    <section className={`category-section ${className}`}>
      <h3>어떤 짐을 보관하시나요?</h3>

      <div className="category-grid">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            className="category-card"
            role="button"
            tabIndex={0}
            onClick={() => handleCardActivate(idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            aria-label={`${cat.label} 선택`}
          >
            <img src={cat.img} alt={cat.label} />
            <p>
              {cat.label}
              <br />
              <small>{cat.price}</small>
            </p>
          </div>
        ))}
      </div>

      {/* 캐리어 선택 모달 */}
      {showCarrierModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowCarrierModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 360 }}
          >
            <div className="modal-header">
              <h3>캐리어 크기를 선택하세요</h3>
            </div>
            <div className="modal-body">
              <p>보관하실 캐리어의 크기를 골라주세요.</p>
              <div className="carrier-size-actions" style={{ display: "grid", gap: 12, marginTop: 12 }}>
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => chooseCarrier("small")}
                >
                  캐리어 소형
                </button>
                <button
                  className="btn btn--outline"
                  type="button"
                  onClick={() => chooseCarrier("large")}
                >
                  캐리어 대형
                </button>
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: 14 }}>
              <button className="btn btn--ghost" type="button" onClick={() => setShowCarrierModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CategorySection;
