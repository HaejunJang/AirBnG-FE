import qs from "qs";
import { httpAuth, httpPublic } from "./http";

export const getReservationList = ({ isDropper, memberId, state, nextCursorId, period }) => {
    // 프론트에서 안전하게 전처리
    const safeState = state ? state.map((s) => s.toUpperCase()) : undefined;
    const safePeriod = period ? period.toUpperCase() : undefined;

    return httpPublic.get("/reservations", {
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



// 예약 상세 조회
export const getReservationDetailApi = (reservationId, memberId) => {
    return httpAuth.get(`/reservations/${reservationId}/members/${memberId}/detail`);
};

// 예약 취소
export const cancelReservationApi = (reservationId, memberId) => {
    return httpAuth.post(`/reservations/${reservationId}/members/${memberId}/cancel`);
};


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


