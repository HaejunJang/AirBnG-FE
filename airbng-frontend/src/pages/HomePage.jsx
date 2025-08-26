// src/pages/HomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

import "../styles/pages/home.css";

// 홈 섹션 컴포넌트
import TopBar from "../components/home/TopBar";
import Greeting from "../components/home/Greeting";
import InfoCard from "../components/home/InfoCard";
import CategorySection from "../components/home/CategorySection";
import PopularSection from "../components/home/PopularSection";

function HomePage() {
  const navigate = useNavigate();

  // TODO: 실제 로그인 상태는 전역 상태(context)와 연결
  const isLoggedIn = false;

  // 짐 타입 카드 클릭
  const handleCategoryClick = (index) => {
    if (!isLoggedIn) {
      if (window.confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
        navigate("/page/login");
      }
      return;
    }

    // index → jimTypeId 매핑
    const jimTypeIdMap = { 0: 1, 1: 2, 2: 4, 3: 5 };

    if (index === 1) {
      // 캐리어: 소형/대형 선택 모달 예정
      // e.g. navigate(`/page/lockerSearch?jimTypeId=2`);
      // e.g. navigate(`/page/lockerSearch?jimTypeId=3`);
      return;
    }

    const jimTypeId = jimTypeIdMap[index];
    if (jimTypeId) {
      navigate(`/page/lockerSearch?jimTypeId=${jimTypeId}`);
    }
  };

  // 인기 보관소 클릭
  const handlePopularClick = (lockerId) => {
    navigate(`/page/lockers/${lockerId}`);
  };

  return (
    <>
      <div className="top-section">
        <TopBar />
        <span className="ring ring--bell" aria-hidden />
        <span className="ring ring--greeting" aria-hidden />
        <span className="ring ring--greeting-inner" aria-hidden />
        <Greeting />
      </div>

      {/* 지역 기본값은 필요 시 props로 교체 */}
      <InfoCard locationName="강남구" />

      {/* 카테고리/인기 섹션 */}
      <CategorySection onCategoryClick={handleCategoryClick} />
      <PopularSection onPopularClick={handlePopularClick} />
    </>
  );
}

export default HomePage;
