import { http } from "./http";

// 예약 생성
export const getReservationForm = async (lockerId) => {
  const response = await http.get("/reservations/form?lockerId=" + lockerId);
  return response.data;
};
