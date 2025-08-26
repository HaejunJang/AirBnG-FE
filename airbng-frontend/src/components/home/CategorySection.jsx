import React from "react";
import backpackImg from "../../assets/backpack_img.svg";
import carrierImg from "../../assets/carrier_img.svg";
import boxImg from "../../assets/box_img.svg";
import strollerImg from "../../assets/stroller_img.svg";

const categories = [
  { img: backpackImg, label: "백팩/가방", price: "시간당 2,000원부터" },
  { img: carrierImg, label: "캐리어",   price: "시간당 2,500원부터" },
  { img: boxImg,      label: "박스/큰 짐", price: "시간당 4,000원부터" },
  { img: strollerImg, label: "유모차",    price: "시간당 5,000원부터" },
];

function CategorySection({ onCategoryClick, className = "" }) {
  const handleKeyDown = (e, idx) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCategoryClick && onCategoryClick(idx);
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
            onClick={() => onCategoryClick && onCategoryClick(idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
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
    </section>
  );
}

export default CategorySection;
