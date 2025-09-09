import qs from "qs";
import { httpAuth, httpPublic } from "./http";

export const getReservationList = ({ isDropper, memberId, state, nextCursorId, period }) => {
    const safeState = state?.map(s => s.toUpperCase());
    const safePeriod = period?.toUpperCase();

    return httpAuth.get("/reservations", {
        params: {
            isDropper,
            memberId,      // 여기 추가
            state: safeState,
            nextCursorId,
            period: safePeriod,
        },
        paramsSerializer: params =>
            qs.stringify(params, { arrayFormat: "repeat", skipNulls: true }),
    });
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

//예약 삭제
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


