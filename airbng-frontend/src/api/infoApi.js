import { httpAuth } from "./http";

// 사용자 프로필 조회
export const infoApi = {
    getUserInfo: (memberId) => httpAuth.get(`/members/my-page/${memberId}`),
};

// 사용자 프로필 수정
export const updateUserInfo = (formData) => {
    return httpAuth.post("/members/my-page/update", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};