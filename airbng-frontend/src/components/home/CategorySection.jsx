import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useModal, Modal } from "../common/ModalUtil";
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
  const modal = useModal();

  const goToJimType = useCallback(
    (jimTypeId) => {
      const target = `/page/lockerSearch?jimTypeId=${jimTypeId}`;
      if (!ready) return;
      navigate(target);
    }, [ready, navigate]
  );

  const handleCardActivate = useCallback(
    (idx) => {
      if (onCategoryClick) onCategoryClick(idx);

      if (idx === 1) {
        modal.showConfirm(
          "캐리어 크기 선택",
          "보관하실 캐리어의 크기를 골라주세요.",
          () => { // 확인 버튼 → 캐리어 대형
            goToJimType(3);
            modal.hideModal();
          },
          () => { // 취소 버튼 → 캐리어 소형
            goToJimType(2);
            modal.hideModal();
          }
        );
        // 버튼 텍스트 변경 (캐리어 소형/캐리어 대형)
        setTimeout(() => {
          const btns = document.querySelectorAll('.modal-util-btn');
          if (btns.length === 2) {
            btns[0].textContent = "캐리어 소형";
            btns[1].textContent = "캐리어 대형";
          }
        }, 10);
        return;
      }
      const jimTypeId = NORMAL_JIM_MAP[idx];
      if (jimTypeId) goToJimType(jimTypeId);
    },
    [onCategoryClick, goToJimType, modal]
  );

  const handleKeyDown = (e, idx) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardActivate(idx);
    }
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
      <Modal {...modal.modalState} onClose={modal.hideModal} />
    </section>
  );
}

export default CategorySection;
