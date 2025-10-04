import { httpAuth } from "./http";

// 지갑 관련 API
export const walletApi = {
  // 지갑 정보 조회 (잔액 + 연동 계좌)
  getWalletInfo: () => httpAuth.get("/wallet/me/overview"),

  // 포인트 충전 - 헤더 설정 방식 수정
  chargePoint: (data, idemKey) => {
    return httpAuth.post("/wallet/me/topup", data, {
      headers: {
        "Idempotency-Key": idemKey,
      },
    });
  },
  // 포인트 출금
  // withdrawPoint: (data) => httpAuth.post("/wallet/me/withdraw", data),
  withdrawPoint: (data, idemKey) => {
    return httpAuth.post("/wallet/me/withdraw", data, {
      headers: {
        "Idempotency-Key": idemKey,
      },
    });
  },

  // 지갑 사용 내역 조회 함수 수정
  getWalletHistory: (queryParams = "") => {
    const url = queryParams
      ? `/wallet/me/history?${queryParams}`
      : "/wallet/me/history";
    return httpAuth.get(url);
  },

  // 계좌 등록
  registerAccount: (data) => httpAuth.post("/account", data),

  // 주계좌 설정
  setPrimaryAccount: (accountId) =>
    httpAuth.patch(`/account/${accountId}/set-primary`),

  // 계좌 삭제
  deleteAccount: (accountId) => httpAuth.delete(`/account/${accountId}`),
};
