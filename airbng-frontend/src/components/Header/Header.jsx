import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/layout/header.css";
import arrowLeftIcon from "../../assets/arrow-left.svg";
import homeIcon from "../../assets/home.svg";
/**
 * AirBnG Header
 *
 * props:
 * - headerTitle: string
 * - showBackButton: boolean
 * - backUrl?: string        // 있으면 그 경로로 navigate, 없으면 navigate(-1)
 * - showHomeButton: boolean
 * - homeUrl?: string        // 없으면 "/" 로 navigate
 * - className?: string
 *
 * 사용 예:
 * <Header headerTitle="AirBnG" showBackButton showHomeButton />
 */
export default function Header({
  headerTitle = "AirBnG",
  showBackButton = false,
  backUrl,
  showHomeButton = false,
  homeUrl = "/",
  className = "",
  onBack,
  onHome,
  hideBorder = false,
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) return onBack();
    if (backUrl) navigate(backUrl);
    else navigate(-1);
  };

  const handleHome = () => {
    if (onHome) return onHome();
    navigate(homeUrl);
  };

  return (
    <header
      className={`common-header ${className} ${hideBorder ? "no-border" : ""}`}
    >
      {showBackButton ? (
        <button
          type="button"
          className="back-icon"
          aria-label="뒤로가기"
          onClick={handleBack}
        >
          <img src={arrowLeftIcon} alt="" aria-hidden="true" />
        </button>
      ) : (
        <div className="back-spacer" aria-hidden="true" />
      )}

      <div className="header-title">{headerTitle}</div>

      {showHomeButton ? (
        <button
          type="button"
          className="home-icon"
          aria-label="홈으로"
          onClick={handleHome}
        >
          <img src={homeIcon} alt="" aria-hidden="true" />
        </button>
      ) : (
        <div className="header-spacer" aria-hidden="true" />
      )}
    </header>
  );
}
