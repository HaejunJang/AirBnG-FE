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
  withdrawPoint: (data) => httpAuth.post("/wallet/withdraw", data),

  // 지갑 사용 내역 조회
  getWalletHistory: (memberId, params) =>
    httpAuth.get(`/wallet/${memberId}/history`, { params }),

  // 계좌 등록
  registerAccount: (data) => httpAuth.post("/account", data),

  // 주계좌 설정
  setPrimaryAccount: (accountId) =>
    httpAuth.put(`/wallet/account/${accountId}/primary`),
};
