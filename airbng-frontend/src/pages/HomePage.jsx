// src/pages/HomePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/home.css";
import TopBar from "../components/home/TopBar"
import Greeting from "../components/home/Greeting";
import InfoCard from "../components/home/InfoCard";
import CategorySection from "../components/home/CategorySection";
import PopularSection from "../components/home/PopularSection";
import { getPopularTop5 } from "../api/lockerApi";
import {useDot} from "../hooks/useDot";
import {useAuth} from "../context/AuthContext";

function HomePage() {
  const navigate = useNavigate();
  const isLoggedIn = false;

  const { user } = useAuth();
  const memberId = user?.id;
  const { hasDot } = useDot(memberId);

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

  const handleCategoryClick = (index) => {
    if (!isLoggedIn) {
      if (window.confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
        navigate("/page/login");
      }
      return;
    }
    const jimTypeIdMap = { 0: 1, 1: 2, 2: 4, 3: 5 };
    if (index === 1) return; // 캐리어 모달 예정
    const jimTypeId = jimTypeIdMap[index];
    if (jimTypeId) navigate(`/page/lockerSearch?jimTypeId=${jimTypeId}`);
  };

  const handlePopularClick = (lockerId) => {
    navigate(`/page/lockers/${lockerId}`);
  };

  return (
      <>
       {/*<SSEProvider memberId={window.memberId}>*/}
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
     {/*</SSEProvider>*/}
       </>
  );
}
export default HomePage;
