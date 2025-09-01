import { http } from "./http";

// 예약 폼 가져오기
export const getReservationForm = async (lockerId) => {
  const response = await http.get("/reservations/form?lockerId=" + lockerId);
  return response.data;
};

// 예약 post
export const postReservation = async (req) => {
  const response = await http.post("/reservations", req, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};
