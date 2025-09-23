import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { walletApi } from "../api/myWalletApi";
import styles from "../styles/pages/MyWallet.module.css";
import plusIcon from "../assets/plusIcon.svg";
import minusIcon from "../assets/minusIcon.svg";
import historyIcon from "../assets/historyIcon.svg";
import cardIcon from "../assets/cardIcon.svg";
import { Modal, useModal } from "../components/common/ModalUtil";

export default function MyWallet() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const modal = useModal();

  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);

  const getBankIcon = (bankCode) => {
    switch (bankCode) {
      case 6: // 국민
        return require("../assets/bank-kb.svg").default;
      case 88: // 신한
        return require("../assets/bank-shinhan.svg").default;
      case 11: // 농협
        return require("../assets/bank-noghyeup.svg").default;
      case 81: // 하나
        return require("../assets/bank-hana.svg").default;
      case 90: // 카카오
        return require("../assets/bank-kakao.svg").default;
      case 92: // 토스
        return require("../assets/bank-toss.svg").default;
      default:
        return require("../assets/bank-default.svg").default;
    }
  };

  const toggleDropdown = (accountId) => {
    setActiveDropdown(activeDropdown === accountId ? null : accountId);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSetPrimary = (accountId) => {
    console.log("주계좌 변경:", accountId);
    setActiveDropdown(null);
    // TODO: API 연동
  };

  const handleDeleteAccount = (accountId) => {
    console.log("계좌 삭제:", accountId);
    setActiveDropdown(null);
    // TODO: API 연동
  };

  const formatWon = (amount) => {
    if (amount == null) return "0원";
    const num = typeof amount === "number" ? amount : Number(amount);
    if (Number.isNaN(num)) return "0원";
    return new Intl.NumberFormat("ko-KR").format(num) + "원";
  };

  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return "";
    if (accountNumber.length <= 4) return accountNumber;
    const visiblePart = accountNumber.slice(-4);
    const maskedPart = "*".repeat(accountNumber.length - 4);
    return maskedPart + visiblePart;
  };

  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await walletApi.getWalletInfo();

      if (response.status === 200 && response.data.code === 1000) {
        setWalletData(response.data.result);
      } else {
        setError(response.data?.message || "지갑 정보를 불러올 수 없습니다.");
      }
    } catch (err) {
      console.error("지갑 정보 조회 실패:", err);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchWalletData();
    } else {
      navigate("/page/login");
    }
  }, [isLoggedIn, fetchWalletData, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const goToCharge = () => {
    navigate("/page/mypage/wallet/charge");
  };

  const goToWithdraw = () => {
    if (!walletData?.accounts?.length) {
      modal.showError("출금 불가", "출금을 위해서는 먼저 계좌를 등록해주세요.");
      return;
    }
    navigate("/page/mypage/wallet/withdraw");
  };

  const goToHistory = () => {
    navigate("/page/mypage/wallet/history");
  };

  const goToAddAccount = () => {
    navigate("/page/mypage/account/add");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={handleBack} />
          </div>
          <h1 className={styles.headerTitle}>짐페이</h1>
        </header>

        <main className={styles.mainContent}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>지갑 정보를 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={handleBack} />
          </div>
          <h1 className={styles.headerTitle}>짐페이</h1>
        </header>

        <main className={styles.mainContent}>
          <div className={styles.error}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3 className={styles.errorTitle}>오류가 발생했습니다</h3>
            <p className={styles.errorDesc}>{error}</p>
            <button className={styles.retryBtn} onClick={fetchWalletData}>
              다시 시도
            </button>
          </div>
        </main>
      </div>
    );
  }

  const primaryAccount = walletData?.accounts?.find(
    (account) => account.primary
  );
  const hasAccounts = walletData?.accounts?.length > 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleBack} />
        </div>
        <h1 className={styles.headerTitle}>짐페이</h1>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.walletCard}>
          <div className={styles.walletHeader}>
            <img src={cardIcon} alt="충전" className={styles.walletIcon} />
            <h2 className={styles.walletTitle}>짐페이</h2>
          </div>
          <div className={styles.walletBalance}>
            <p className={styles.balanceLabel}>현재 잔액</p>
            <h1 className={styles.balanceAmount}>
              {formatWon(walletData?.balance)}
            </h1>
          </div>
          <div className={styles.walletActionButtons}>
            <button className={styles.walletActionBtn} onClick={goToCharge}>
              <img
                src={plusIcon}
                alt="충전"
                className={styles.walletActionBtnIcon}
              />
              <span className={styles.walletActionBtnText}>충전</span>
            </button>
            <button className={styles.walletActionBtn} onClick={goToWithdraw}>
              <img
                src={minusIcon}
                alt="출금"
                className={styles.walletActionBtnIcon}
              />
              <span className={styles.walletActionBtnText}>출금</span>
            </button>
            <button className={styles.walletActionBtn} onClick={goToHistory}>
              <img
                src={historyIcon}
                alt="거래내역"
                className={styles.walletActionBtnIcon}
              />
              <span className={styles.walletActionBtnText}>내역</span>
            </button>
          </div>
        </div>

        <div className={styles.accountSection}>
          <div className={styles.sectionTitle}>
            <span>연동 계좌</span>
            {hasAccounts && (
              <button
                className={styles.addAccountBtn}
                onClick={goToAddAccount}
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                + 계좌 등록
              </button>
            )}
          </div>

          {hasAccounts ? (
            <div>
              {primaryAccount && (
                <div className={styles.accountCard}>
                  <div className={styles.accountHeader}>
                    <div className={styles.bankInfo}>
                      <div className={styles.bankIconContainer}>
                        <img
                          src={getBankIcon(
                            primaryAccount.bankCodes?.[0]?.bankCode
                          )}
                          alt={`${primaryAccount.bankCodes?.[0]?.korName} 로고`}
                          className={styles.bankIcon}
                        />
                      </div>
                      <div>
                        <div className={styles.bankName}>
                          {primaryAccount.bankCodes?.[0]?.korName || "은행"}은행
                        </div>
                      </div>
                    </div>
                    <div className={styles.accountActions}>
                      <span className={styles.primaryBadge}>주계좌</span>
                      <div className={styles.menuContainer}>
                        <button
                          className={styles.menuButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(primaryAccount.accountId);
                          }}
                        >
                          ⋯
                        </button>
                        {activeDropdown === primaryAccount.accountId && (
                          <div className={styles.dropdown}>
                            <button
                              className={styles.dropdownItem}
                              onClick={() =>
                                handleDeleteAccount(primaryAccount.accountId)
                              }
                            >
                              계좌 삭제하기
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.accountDetails}>
                    <p className={styles.accountNumber}>
                      {maskAccountNumber(primaryAccount.accountNumber)}
                    </p>
                    <p className={styles.holderName}>
                      계좌주 : {primaryAccount.holderName}
                    </p>
                  </div>
                </div>
              )}

              {walletData.accounts
                .filter((account) => !account.primary)
                .map((account) => (
                  <div key={account.accountId} className={styles.accountCard}>
                    <div className={styles.accountHeader}>
                      <div className={styles.bankInfo}>
                        <div className={styles.bankIconContainer}>
                          <img
                            src={getBankIcon(account.bankCodes?.[0]?.bankCode)}
                            alt={`${account.bankCodes?.[0]?.korName} 로고`}
                            className={styles.bankIcon}
                          />
                        </div>
                        <div>
                          <div className={styles.bankName}>
                            {account.bankCodes?.[0]?.korName || "은행"}은행
                          </div>
                        </div>
                      </div>
                      <div className={styles.menuContainer}>
                        <button
                          className={styles.menuButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(account.accountId);
                          }}
                        >
                          ⋯
                        </button>
                        {activeDropdown === account.accountId && (
                          <div className={styles.dropdown}>
                            <button
                              className={styles.dropdownItem}
                              onClick={() =>
                                handleSetPrimary(account.accountId)
                              }
                            >
                              주계좌 변경
                            </button>
                            <button
                              className={styles.dropdownItem}
                              onClick={() =>
                                handleDeleteAccount(account.accountId)
                              }
                            >
                              계좌 삭제하기
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.accountDetails}>
                      <p className={styles.accountNumber}>
                        계좌번호 : {maskAccountNumber(account.accountNumber)}
                      </p>
                      <p className={styles.holderName}>
                        계좌주 : {account.holderName}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className={styles.noAccount}>
              <h3 className={styles.noAccountTitle}>연동된 계좌가 없습니다</h3>
              <p className={styles.noAccountDesc}>
                계좌를 등록하면 쉽게 충전하고
                <br />
                출금할 수 있어요
              </p>
              <button className={styles.addAccountBtn} onClick={goToAddAccount}>
                계좌 등록하기
              </button>
            </div>
          )}
        </div>
        <Modal {...modal.modalState} onClose={modal.hideModal} />
      </main>
    </div>
  );
}
