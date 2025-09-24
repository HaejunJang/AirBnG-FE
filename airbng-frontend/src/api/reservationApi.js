import qs from "qs";
import { httpAuth, httpPublic } from "./http";

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
export const cancelReservationApi = (reservationId) => {
  return httpAuth.patch(`/reservations/${reservationId}/cancel`);
};

// 예약 승인/거절
export const confirmReservationApi = (reservationId, approve) => {
  return httpAuth.patch(
    `/reservations/${reservationId}/confirm?approve=${approve}`
  );
};

// 예약 완료
export const completeReservationApi = (reservationId, approve) => {
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
