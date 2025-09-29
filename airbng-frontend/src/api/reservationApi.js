import qs from "qs";
import { httpAuth, httpPublic } from "./http";
import { v4 as uuid } from 'uuid';

const newIdemKey = () => {
  // browser(window) 우선, web worker(self) 보조
  const g = typeof window !== 'undefined' ? window : undefined;
  if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
  return uuid(); // 폴백
};
const _idemCache = new Map();

export const getReservationList = ({
  isDropper,
  memberId,
  state,
  nextCursorId,
  period,
}) => {
  const safeState = state?.map((s) => s.toUpperCase());
  const safePeriod = period?.toUpperCase();

  return httpAuth.get("/reservations", {
    params: {
      isDropper,
      memberId,
      state: safeState,
      nextCursorId,
      period: safePeriod,
    },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat", skipNulls: true }),
  });
};

// 예약 취소
export const cancelReservationApi = async (reservationId) => {
  const key = _idemCache.get(reservationId) ?? newIdemKey();
  _idemCache.set(reservationId, key);
  try {
    const res = await httpAuth.patch(
      `/reservations/${reservationId}/cancel`,
      null,
      { headers: { 'Idempotency-Key': key } }
    );
    // 성공하면 캐시 제거
    _idemCache.delete(reservationId);
    return res;
  } catch (e) {
    // 실패 시 재시도하면 같은 키를 쓰도록 캐시 유지
    throw e;
  }
};

// 예약 승인/거절
export const confirmReservationApi = (reservationId, approve) => {
  return httpAuth.patch(
    `/reservations/${reservationId}/confirm?approve=${approve}`
  );
};

// 예약 완료
export const completeReservationApi = (reservationId) => {
  return httpAuth.patch(`/reservations/${reservationId}/complete`);
};

// 예약 폼 가져오기
export const getReservationForm = async (lockerId) => {
  const response = await httpAuth.get(
    "/reservations/form?lockerId=" + lockerId
  );
  return response.data;
};

//예약 삭제
export const deleteReservationApi = (reservationId) => {
  return httpAuth.post(`/reservations/delete`, null, {
    params: { reservationId },
  });
};

// 예약 post
export const postReservation = async (req, idemkey) => {
  const response = await httpAuth.post("/reservations", req, {
    headers: { "Content-Type": "application/json", "Idempotency-Key": idemkey },
  });
  return response.data;
};

// 예약 상세보기
export const getReservationDetail = async (reservationId, memberId) => {
  const response = await httpAuth.get(
    `/reservations/${reservationId}/members/${memberId}/detail`
  );
  return response.data;
};

// 포인트 잔액 조회
export const getWalletBalance = async () => {
  const response = await httpAuth.get("/wallet/me/balance");
  return response.data;
};
