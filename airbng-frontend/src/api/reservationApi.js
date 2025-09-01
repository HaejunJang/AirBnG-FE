import qs from "qs";
import { httpAuth, httpPublic } from "./http";

// params 객체를 받아 백엔드 쿼리 파라미터로 전달
export const getReservationList = ({ isDropper, memberId, state, nextCursorId, period }) => {
    return httpAuth.get("/reservations", {
        params: {
            isDropper,
            memberId,
            state,       // 배열이면 Axios가 자동으로 쿼리스트링으로 변환
            nextCursorId,
            period
        },
        paramsSerializer: (params) =>
            qs.stringify(params, { arrayFormat: "repeat", skipNulls: true })
    });
}

// 예약 폼 가져오기
    export const getReservationForm = async (lockerId) => {
        const response = await httpPublic.get(
            "/reservations/form?lockerId=" + lockerId
        );
        return response.data;
    };

    export const deleteReservationApi = (reservationId) => {
        return httpAuth.post(`/reservations/delete`, null, {
            params: {reservationId},
        });
    }

// 예약 post
    export const postReservation = async (req) => {
        const response = await httpPublic.post("/reservations", req, {
            headers: {"Content-Type": "application/json"},
        });
        return response.data;
    };


