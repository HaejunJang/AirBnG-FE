import { httpAuth, httpPublic } from "./http";

// 인기 보관소
export const getPopularTop5 = () => httpPublic.get("/lockers/popular");

// 특정 보관소 조회
export const getLockerById = (lockerId) =>
  httpPublic.get(`/lockers/${lockerId}`, lockerId);

// 보관소 활성화/비활성화 토글
export const toggleLockerActivation = (lockerId) =>
  httpAuth.patch(`/lockers/${lockerId}`);

// 특정 보관소 삭제
export const deleteLocker = (lockerId) =>
  httpAuth.delete(`/lockers/${lockerId}`);

// 보관소 등록
export const registerLocker = ({ locker, images = [] }) => {
  const fd = new FormData();
  fd.append(
    "locker",
    new Blob([JSON.stringify(locker)], { type: "application/json" })
  );
  images.forEach((f) => fd.append("images", f));
  return httpAuth.post("/lockers/register", fd);
};

// 특정 보관소 수정
export const updateLocker = ({ lockerId, locker, images = [] }) => {
  const fd = new FormData();
  fd.append(
    "locker",
    new Blob([JSON.stringify(locker)], { type: "application/json" })
  );
  images.forEach((f) => fd.append("images", f));
  return httpAuth.post("/lockers/update/${lockerId}", fd);
};
// 내가 보유한 보관소 존재 여부
export const hasMyLocker = () => httpAuth.get("/lockers/me/exist");

// 보관소 검색
export const searchLockers = ({ address, lockerName, jimTypeId }) => {
  return httpPublic.get("/lockers", {
    params: {
      address: address || "",
      lockerName: lockerName || "",
      jimTypeId: jimTypeId || null,
    },
  });
};

// 수정할 특정 보관소 정보 조회
export const getLockerForUpdate = (lockerId) =>
  httpAuth.get(`/lockers/update/${lockerId}`);

// 상세
export const getMyLocker = () => httpAuth.get("/lockers/me");

// 수정용
// export const getMyLockerForUpdate = () => httpAuth.get("/lockers/me/update");

// 찜 여부 확인
export const checkZzimExists = (lockerId, memberId) =>
  httpAuth.get(`/lockers/${lockerId}/members/${memberId}/zzim/exists`);

// 찜 토글
export const toggleZzim = (lockerId, memberId) =>
  httpAuth.post(`/lockers/${lockerId}/members/${memberId}/zzim`);

// export const getMyLockerForUpdate = () => httpAuth.get("/lockers/me/update");
