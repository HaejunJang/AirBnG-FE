import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/layout/header.module.css";
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
      className={`${styles.commonHeader} ${className} ${
        hideBorder ? styles.noBorder : ""
      }`}
    >
      {showBackButton ? (
        <button
          type="button"
          className={styles.backIcon}
          aria-label="뒤로가기"
          onClick={handleBack}
        >
          <img src={arrowLeftIcon} alt="" aria-hidden="true" />
        </button>
      ) : (
        <div className={styles.backSpacer} aria-hidden="true" />
      )}

      <div className={styles.headerTitle}>{headerTitle}</div>

      {showHomeButton ? (
        <button
          type="button"
          className={styles.homeIcon}
          aria-label="홈으로"
          onClick={handleHome}
        >
          <img src={homeIcon} alt="" aria-hidden="true" />
        </button>
      ) : (
        <div className={styles.headerSpacer} aria-hidden="true" />
      )}
    </header>
  );
}
