import { httpAuth } from "../http";

export const getAdminFirstPage = () => httpAuth.get("/admin");

// 보관소 리뷰 목록 조회 (상태별 + 페이징)
export const getLockerReviewsByStatus = (status, page = 1) =>
    httpAuth.get(`/admin/lockers`, {
        params: {
            status: status,
            page: page
        }
    });

// 보관소 리뷰 상세 조회
export const getLockerReviewDetail = (lockerReviewId) =>
    httpAuth.get(`/admin/lockers/${lockerReviewId}`);

// 보관소 승인
export const approveLockerReview = (lockerReviewId, memberId) =>
    httpAuth.post("/admin/lockers/approve", null, {
        params: {
            lockerReviewId: lockerReviewId,
            memberId: memberId
        }
    });

// 보관소 반려
export const rejectLockerReview = (lockerReviewId, memberId, reason) =>
    httpAuth.post("/admin/lockers/reject", null, {
        params: {
            lockerReviewId: lockerReviewId,
            memberId: memberId,
            reason: reason
        }
    });

// 편의를 위한 상태별 조회 함수들
export const getPendingLockers = (page = 1) =>
    getLockerReviewsByStatus('WAITING', page);

export const getApprovedLockers = (page = 1) =>
    getLockerReviewsByStatus('APPROVED', page);

export const getRejectedLockers = (page = 1) =>
    getLockerReviewsByStatus('REJECTED', page);

// 상태별 전체 데이터 조회 (요약용)
export const getAllLockerReviewsSummary = async () => {
    try {
        const [pendingResponse, approvedResponse, rejectedResponse] = await Promise.all([
            getPendingLockers(1),
            getApprovedLockers(1),
            getRejectedLockers(1)
        ]);

        return {
            pending: pendingResponse.data,
            approved: approvedResponse.data,
            rejected: rejectedResponse.data
        };
    } catch (error) {
        console.error('요약 데이터 조회 실패:', error);
        throw error;
    }
};