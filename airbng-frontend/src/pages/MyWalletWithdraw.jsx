import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { walletApi } from "../api/myWalletApi";
import { getOrCreateIdemKey, clearIdemKey } from "../utils/idempotency";
import styles from "../styles/pages/WalletWithdraw.module.css";
import cardIcon from "../assets/cardIcon.svg";
import { Modal, useModal } from "../components/common/ModalUtil";

export default function WalletWithdraw() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // 상태 관리
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  //   const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  //모달
  const {
    modalState,
    hideModal,
    showSuccess,
    showError,
    showConfirm,
    showLoading,
  } = useModal();

  // 은행 아이콘 매핑 함수
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

  // 금액 포맷터
  const formatWon = (amount) => {
    if (amount == null) return "0원";
    const num = typeof amount === "number" ? amount : Number(amount);
    if (Number.isNaN(num)) return "0원";
    return new Intl.NumberFormat("ko-KR").format(num) + "원";
  };

  // 계좌번호 마스킹
  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return "";
    if (accountNumber.length <= 4) return accountNumber;
    const visiblePart = accountNumber.slice(-4);
    const maskedPart = "*".repeat(accountNumber.length - 4);
    return maskedPart + visiblePart;
  };

  // 지갑 정보 조회
  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await walletApi.getWalletInfo();

      if (response.status === 200 && response.data.code === 1000) {
        const data = response.data.result;
        setWalletData(data);

        // 주계좌를 기본 선택으로 설정
        const primaryAccount = data.accounts?.find(
          (account) => account.primary
        );
        if (primaryAccount) {
          setSelectedAccount(primaryAccount);
        }
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

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (isLoggedIn) {
      fetchWalletData();
    } else {
      navigate("/page/login");
    }
  }, [isLoggedIn, fetchWalletData, navigate]);

  // 뒤로가기
  const handleBack = () => {
    navigate(-1);
  };

  // 계좌 선택
  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
  };

  // 출금하기
  const handleWithdraw = async () => {
    if (!selectedAccount) {
      alert("출금할 계좌를 선택해주세요.");
      return;
    }

    const availableBalance = walletData?.balance || 0;

    if (availableBalance === 0) {
      alert("출금 가능한 금액이 없습니다.");
      return;
    }

    setIsWithdrawing(true);

    try {
      await showLoading("출금 처리 중입니다...", "잠시만 기다려주세요", 500);
      const scope = `wallet:withdraw:${selectedAccount.accountId}:${availableBalance}`;
      const idemKey = getOrCreateIdemKey(scope);

      const requestData = {
        accountId: selectedAccount.accountId,
      };

      const response = await walletApi.withdrawPoint(requestData, idemKey);

      if (response.status === 200 && response.data.code === 1000) {
        clearIdemKey(scope);
        // alert("전액 출금 완료");
        showSuccess(
          "출금 완료",
          `${formatWon(availableBalance)}이 출금되었습니다.`,
          () => {
            navigate("/page/mypage/wallet", {
              state: {
                message: `${formatWon(availableBalance)}이 출금되었습니다.`,
              },
            });
          }
        );
      } else {
        // alert(response.data?.message || "출금에 실패했습니다.");
        showError("출금에 실패했습니다.", () => {
          console.log("실패");
        });
      }
    } catch (error) {
      // 에러 처리...
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={handleBack} />
          </div>
          <h1 className={styles.headerTitle}>짐페이 출금</h1>
        </header>
        <main className={styles.mainContent}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>로딩 중...</p>
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
          <h1 className={styles.headerTitle}>짐페이 출금</h1>
        </header>
        <main className={styles.mainContent}>
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={fetchWalletData}>다시 시도</button>
          </div>
        </main>
      </div>
    );
  }

  const hasAccounts = walletData?.accounts?.length > 0;
  const availableBalance = walletData?.balance || 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleBack} />
        </div>
        <h1 className={styles.headerTitle}>짐페이 출금</h1>
      </header>

      <main className={styles.mainContent}>
        {/* 보유 금액 표시 */}
        <div className={styles.walletCard}>
          <div className={styles.walletHeader}>
            <img src={cardIcon} alt="짐페이" className={styles.walletIcon} />
            <h2 className={styles.walletTitle}>짐페이</h2>
          </div>
          <div className={styles.walletBalance}>
            <p className={styles.balanceLabel}>출금 가능 금액</p>
            <h1 className={styles.balanceAmount}>
              {formatWon(availableBalance)}
            </h1>
          </div>
        </div>

        {/* 입금 계좌 섹션 */}
        <div className={styles.accountSection}>
          <h2 className={styles.sectionTitle}>출금 받을 계좌</h2>

          {hasAccounts ? (
            <div className={styles.accountList}>
              {walletData.accounts.map((account) => (
                <div
                  key={account.accountId}
                  className={`${styles.accountCard} ${
                    selectedAccount?.accountId === account.accountId
                      ? styles.selected
                      : ""
                  }`}
                  onClick={() => handleAccountSelect(account)}
                >
                  <div className={styles.accountInfo}>
                    <div className={styles.bankInfo}>
                      <img
                        src={getBankIcon(account.bankCodes?.[0]?.bankCode)}
                        alt={`${account.bankCodes?.[0]?.korName} 로고`}
                        className={styles.bankIcon}
                      />
                      <div className={styles.bankDetails}>
                        <div className={styles.bankName}>
                          {account.bankCodes?.[0]?.korName || "은행"}
                          {account.primary && (
                            <span className={styles.primaryBadge}>주계좌</span>
                          )}
                        </div>
                        <div className={styles.accountNumber}>
                          {maskAccountNumber(account.accountNumber)}
                        </div>
                        <div className={styles.holderName}>
                          계좌주: {account.holderName}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.selectRadio}>
                    <input
                      type="radio"
                      name="account"
                      checked={selectedAccount?.accountId === account.accountId}
                      onChange={() => handleAccountSelect(account)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noAccount}>
              <p>등록된 계좌가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 이용 안내 */}
        <div className={styles.infoSection}>
          <h3 className={styles.infoTitle}>이용 안내</h3>
          <ul className={styles.infoList}>
            <li>출금은 등록된 계좌로만 가능합니다.</li>
            <li>출금 금액은 전액 출금입니다.</li>
            <li>출금 수수료는 무료입니다.</li>
          </ul>
        </div>

        {/* 출금하기 버튼 */}
        <button
          className={`${styles.withdrawBtn} ${
            !selectedAccount || isWithdrawing || availableBalance === 0
              ? styles.disabled
              : ""
          }`}
          onClick={handleWithdraw}
          disabled={!selectedAccount || isWithdrawing || availableBalance === 0}
        >
          {isWithdrawing
            ? "출금 중..."
            : `전액 출금 (${formatWon(availableBalance)})`}
        </button>
        {/* 모달 컴포넌트 */}
        <Modal
          show={modalState.show}
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
          confirmText={modalState.confirmText}
          onConfirm={modalState.onConfirm}
          onClose={hideModal}
        />
      </main>
    </div>
  );
}
