// src/pages/HomePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/home.css";
import TopBar from "../components/home/TopBar";
import Greeting from "../components/home/Greeting";
import InfoCard from "../components/home/InfoCard";
import CategorySection from "../components/home/CategorySection";
import PopularSection from "../components/home/PopularSection";
import { getPopularTop5 } from "../api/lockerApi";
import {useDot} from "../hooks/useDot";
import { getUserProfile } from '../utils/jwtUtil';
import { useAuth } from "../context/AuthContext";

function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn, ready } = useAuth();

    const profile = getUserProfile();
    const resolvedMemberId =  profile?.id || null;
    const { hasDot } = useDot(resolvedMemberId);

  // 인기 보관소 상태
  const [popular, setPopular] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  const loadPopular = useCallback(async () => {
    try {
      const { data } = await getPopularTop5();
      if (data?.code === 1000 && data?.result?.lockers) {
        setPopular(data.result.lockers);
      } else {
        setPopular([]);
        console.warn("Unexpected response:", data);
      }
    } catch (e) {
      console.error("TOP5 fetch failed:", e);
      setPopular([]);
    } finally {
      setLoadingPopular(false);
    }
  }, []);

  useEffect(() => { loadPopular(); }, [loadPopular]);

  const jimTypeIdMap = { 0: 1, 1: 2, 2: 4, 3: 5 };

  const handleCategoryClick = (index) => {
    if (!ready) return;                                  // 컨텍스트 준비 전 클릭 무시
    const jimTypeId = jimTypeIdMap[index];

    // if (!isLoggedIn) {
    //   const target = jimTypeId ? `/page/lockerSearch?jimTypeId=${jimTypeId}` : '/page/home';
    //   if (window.confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
    //     navigate(`/page/login?redirect=${encodeURIComponent(target)}`);
    //   }
    //   return;
    // }

    if (index === 1) return; // 캐리어 모달 예정(기존 로직 유지)
    if (jimTypeId) navigate(`/page/lockerSearch?jimTypeId=${jimTypeId}`);
  };

  const handlePopularClick = (lockerId) => {
    navigate(`/page/lockers/${lockerId}`);
  };

  return (
      <>
          <div className="top-section">
            <TopBar hasDot={hasDot}/>
            <span className="ring ring--bell" aria-hidden />
            <span className="ring ring--greeting" aria-hidden />
            <span className="ring ring--greeting-inner" aria-hidden />
            <Greeting />
          </div>

          <InfoCard locationName="강남구" />
          <CategorySection onCategoryClick={handleCategoryClick} />

          <PopularSection
            items={popular}
            loading={loadingPopular}
            onPopularClick={handlePopularClick}
          />
       </>
  );
}
export default HomePage;
