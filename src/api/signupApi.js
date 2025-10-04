import { httpPublic } from "./http";

export const signupApi = {
  // 이메일 중복 확인
  checkEmailDuplicate: async (email) => {
    try {
      console.log("메서드 호출");
      const response = await httpPublic.get(
        `/members/check-email?email=${encodeURIComponent(email)}`
      );
      return response.data;
    } catch (error) {
      console.log("왜 오류냐?");
      throw error.response?.data || { message: "서버 오류가 발생했습니다." };
    }
  },

  // 닉네임 중복 확인
  checkNicknameDuplicate: async (nickname) => {
    try {
      const response = await httpPublic.get(
        `/members/check-nickname?nickname=${encodeURIComponent(nickname)}`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        throw { message: "너무 많은 요청 발생. 잠시 후 다시 시도해주세요." };
      }
      throw error.response?.data || { message: "서버 오류가 발생했습니다." };
    }
  },

  // 회원가입
  signup: async (memberData, profileImage = null) => {
    try {
      const formData = new FormData();

      // 회원 정보를 JSON으로 추가
      formData.append(
        "profile",
        new Blob([JSON.stringify(memberData)], {
          type: "application/json",
        })
      );

      // 프로필 이미지가 있으면 추가
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await httpPublic.post("/members/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "회원가입에 실패했습니다." };
    }
  },
};
