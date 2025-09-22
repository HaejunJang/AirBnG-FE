import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { walletApi } from "../api/myWalletApi";
import styles from "../styles/pages/MyWalletHistory.module.css";
import cardIcon from "../assets/cardIcon.svg";
import plusIcon from "../assets/plusIconBlue.svg";
import minusIcon from "../assets/minusIconRed.svg";

export default function WalletHistory() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const observerTarget = useRef(null);

  // 상태 관리
  const [historyData, setHistoryData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);

  // 거래 타입 매핑
  const getTxTypeInfo = (txType) => {
    const typeMap = {
      TOPUP: { label: "충전", color: "#4561db", icon: plusIcon },
      WITHDRAW: { label: "출금", color: "#e74c3c", icon: minusIcon },
      PAYMENT: { label: "결제", color: "#e74c3c", icon: minusIcon },
      REFUND: { label: "환불", color: "#4561db", icon: plusIcon },
      SETTLEMENT: { label: "정산", color: "#4561db", icon: plusIcon },
    };
    return typeMap[txType] || { label: "기타", color: "#666", icon: null };
  };

  // 필터 옵션
  const filterOptions = [
    { key: "ALL", label: "전체" },
    { key: "TOPUP", label: "충전" },
    { key: "WITHDRAW", label: "출금" },
    { key: "PAYMENT", label: "결제" },
    { key: "REFUND", label: "환불" },
    { key: "SETTLEMENT", label: "정산" },
  ];

  // 금액 포맷터
  const formatWon = (amount) => {
    if (amount == null) return "0원";
    const num = typeof amount === "number" ? amount : Number(amount);
    if (Number.isNaN(num)) return "0원";
    return new Intl.NumberFormat("ko-KR").format(num) + "원";
  };

  // 날짜 포맷터
  const formatDate = (dateString) => {
    return dateString;
  };

  // 지갑 내역 조회
  const fetchWalletHistory = useCallback(
    async (cursor = null, reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setItems([]);
        } else {
          setLoadingMore(true);
        }
        setError("");

        const params = new URLSearchParams();
        if (cursor) params.append("cursor", cursor);
        if (selectedFilter !== "ALL") params.append("type", selectedFilter);
        const queryString = params.toString();
        // console.log("--------- 보내는 url확인 -----------");
        // console.log(
        //   "API 호출 URL:",
        //   `/wallet/me/history${queryString ? "?" + queryString : ""}`
        // );

        const response = await walletApi.getWalletHistory(params.toString());
        // console.log("--------- 받는 응답확인 -----------");
        // console.log("API 응답:", response);
        if (response.status === 200 && response.data.code === 1000) {
          const data = response.data.result;
          setHistoryData(data);

          if (reset) {
            setItems(data.items || []);
          } else {
            setItems((prev) => [...prev, ...(data.items || [])]);
          }

          setNextCursor(data.nextCursor);
          setHasNext(data.hasNext || false);
        } else {
          setError(response.data?.message || "내역을 불러올 수 없습니다.");
        }
      } catch (err) {
        console.error("내역 조회 실패:", err);
        setError("네트워크 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedFilter]
  );

  // 무한 스크롤 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !loadingMore) {
          fetchWalletHistory(nextCursor, false);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNext, loadingMore, nextCursor, fetchWalletHistory]);

  // 필터 변경 시 재조회
  useEffect(() => {
    if (isLoggedIn) {
      fetchWalletHistory(null, true);
    }
  }, [selectedFilter, isLoggedIn, fetchWalletHistory]);

  // 뒤로가기
  const handleBack = () => {
    navigate(-1);
  };

  // 필터 변경
  const handleFilterChange = (filterKey) => {
    setSelectedFilter(filterKey);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={handleBack} />
          </div>
          <h1 className={styles.headerTitle}>짐페이 사용내역</h1>
        </header>

        <main className={styles.mainContent}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>내역을 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  // 에러 상태
  if (error && !items.length) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={handleBack} />
          </div>
          <h1 className={styles.headerTitle}>짐페이 사용내역</h1>
        </header>

        <main className={styles.mainContent}>
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={() => fetchWalletHistory(null, true)}>
              다시 시도
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleBack} />
        </div>
        <h1 className={styles.headerTitle}>짐페이 사용내역</h1>
      </header>

      <main className={styles.mainContent}>
        {/* 보유 금액 */}
        <div className={styles.walletCard}>
          <div className={styles.walletHeader}>
            <img src={cardIcon} alt="짐페이" className={styles.walletIcon} />
            <h2 className={styles.walletTitle}>짐페이</h2>
          </div>
          <div className={styles.walletBalance}>
            <p className={styles.balanceLabel}>보유 금액</p>
            <h1 className={styles.balanceAmount}>
              {formatWon(historyData?.balance)}
            </h1>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className={styles.filterTabs}>
          {filterOptions.map((option) => (
            <button
              key={option.key}
              className={`${styles.filterTab} ${
                selectedFilter === option.key ? styles.active : ""
              }`}
              onClick={() => handleFilterChange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 거래 내역 리스트 */}
        <div className={styles.historyList}>
          {items.length > 0 ? (
            <>
              {items.map((item, index) => {
                const typeInfo = getTxTypeInfo(item.txType);
                return (
                  <div
                    key={`${item.walletTxId}-${index}`}
                    className={styles.historyItem}
                  >
                    <div className={styles.itemLeft}>
                      {typeInfo.icon && (
                        <img
                          src={typeInfo.icon}
                          alt={typeInfo.label}
                          className={styles.typeIcon}
                        />
                      )}
                      <div className={styles.itemInfo}>
                        <div className={styles.itemTitle}>
                          짐페이-{typeInfo.label}
                        </div>
                        <div className={styles.itemDate}>
                          {formatDate(item.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className={styles.itemRight}>
                      <div
                        className={styles.itemAmount}
                        style={{ color: typeInfo.color }}
                      >
                        {/* {typeInfo.symbol} */}
                        {formatWon(item.amount)}
                      </div>
                      <div className={styles.itemStatus}>완료</div>
                    </div>
                  </div>
                );
              })}

              {/* 무한 스크롤 트리거 */}
              {hasNext && (
                <div ref={observerTarget} className={styles.loadMore}>
                  {loadingMore && (
                    <div className={styles.loadingMore}>
                      <div className={styles.smallSpinner} />
                      <span>더 불러오는 중...</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.noHistory}>
              <h3>거래 내역이 없습니다</h3>
              <p>
                {selectedFilter === "ALL"
                  ? "아직 거래 내역이 없어요"
                  : `${
                      filterOptions.find((f) => f.key === selectedFilter)?.label
                    } 내역이 없어요`}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
