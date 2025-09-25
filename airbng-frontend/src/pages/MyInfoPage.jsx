import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMyInfo } from "../hooks/useMyInfo";
import ProfileImageUpload from "../components/info/ProfileImageUpload";
import LoadingSpinner from "../components/info/LoadingSpinner";
import ErrorMessage from "../components/info/ErrorMessage";
import info from "../styles/pages/myInfo.module.css";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header/Header";
import { Modal, useModal } from "../components/common/ModalUtil";

const MyInfoPage = () => {
    const navigate = useNavigate();
    const { user, isLoggedIn } = useAuth();
    const { modalState, showSuccess, showError, hideModal, showLogin } = useModal();

  const {
    userInfo,
    profilePreview,
    isLoading,
    error,
    nicknameValidation,
    isNicknameChanged,
    loadUserInfo,
    handleProfileImageChange,
    checkNicknameDuplicate,
    resetNicknameValidation,
    updateUserInfo,
    updateUserField,
    updatePhoneField,
    setError,
  } = useMyInfo();

    // useCallback으로 함수를 메모이제이션
    const handleLoadUserInfo = useCallback(() => {
        if (user?.id) {
            loadUserInfo(user.id);
        }
    }, [user?.id, loadUserInfo]);

    const handleAuthCheck = useCallback(() => {
        if (!isLoggedIn || !user?.id) {
            showLogin();
            return false;
        }
        return true;
    }, [isLoggedIn, user?.id, showLogin]);

    useEffect(() => {
        console.log("로그인 상태:", isLoggedIn);
        console.log("사용자 정보:", user);

        if (!handleAuthCheck()) {
            return;
        }

        // 사용자 정보 로드
        handleLoadUserInfo();
    }, [isLoggedIn, user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 닉네임이 바뀌었는데 중복검사를 안 했다면 막기
    if (isNicknameChanged && !nicknameValidation.isValid) {
      // 이 조건을 수정
      setError("닉네임 중복 확인을 해주세요.");
      return;
    }

    const success = await updateUserInfo();
    if (success) {
      showSuccess("수정 완료!", "정보가 성공적으로 수정되었습니다.", () => {
        navigate("/page/mypage?profileUpdated=true");
      });
    }
  };

  const getNicknameButtonText = () => {
    if (nicknameValidation.isValid) return "확인완료";
    return "중복확인";
  };

  const getNicknameButtonClass = () => {
    let baseClass = info.checkButton;
    if (nicknameValidation.isValid) baseClass += ` ${info.success}`;
    return baseClass;
  };

  const getNicknameInputClass = () => {
    let baseClass = info.formInput;
    if (nicknameValidation.message) {
      baseClass += nicknameValidation.isValid
        ? ` ${info.success}`
        : ` ${info.error}`;
    }
    return baseClass;
  };

  return (
    <div className={info.pageContainer}>
      <Header
        headerTitle="내 정보 수정"
        showBackButton
        backUrl="/page/mypage"
      />

      <div className={info.editProfileContainer}>
        <div className={info.editProfileHeader}>
          <p className={info.editProfileSubtitle}>
            개인정보를 안전하게 수정하세요
          </p>
        </div>

        <ProfileImageUpload
          profilePreview={profilePreview}
          onImageChange={handleProfileImageChange}
        />

        <ErrorMessage message={error} onClose={() => setError("")} />

        {/*<LoadingSpinner isVisible={isLoading} message="정보를 불러오는 중..." />*/}

        <form className={info.editProfileForm} onSubmit={handleSubmit}>
          {/* 이메일 필드 */}
          <div className={info.inputGroup}>
            <label className={info.inputLabel}>이메일</label>
            <div className={info.inputRow}>
              <input
                type="email"
                className={info.formInput}
                value={userInfo.email || ""}
                readOnly
                disabled
              />
            </div>
            <div className={info.inputHelp}>이메일은 변경할 수 없습니다</div>
          </div>

          {/* 이름 필드 */}
          <div className={info.inputGroup}>
            <label className={info.inputLabel}>이름</label>
            <div className={info.inputRow}>
              <input
                type="text"
                className={info.formInput}
                value={userInfo.name || ""}
                onChange={(e) => updateUserField("name", e.target.value)}
                placeholder="이름을 입력하세요"
                required
              />
            </div>
          </div>

          {/* 전화번호 필드 */}
          <div className={info.inputGroup}>
            <label className={info.inputLabel}>전화번호</label>
            <div className={info.inputRow}>
              <input
                type="tel"
                className={info.formInput}
                value={userInfo.phone || ""}
                onChange={(e) => updatePhoneField(e.target.value)}
                placeholder="휴대폰 번호 입력('-'제외 11자리 입력)"
                maxLength="13"
                required
              />
            </div>
          </div>

          {/* 닉네임 필드 */}
          <div className={info.inputGroup}>
            <label className={info.inputLabel}>닉네임</label>
            <div className={info.inputRow}>
              <input
                type="text"
                className={getNicknameInputClass()}
                value={userInfo.nickname || ""}
                onChange={(e) => {
                  updateUserField("nickname", e.target.value);
                  resetNicknameValidation();
                }}
                placeholder="닉네임을 입력하세요"
                required
              />
              <button
                type="button"
                className={getNicknameButtonClass()}
                onClick={checkNicknameDuplicate}
                disabled={
                  !userInfo.nickname?.trim() || nicknameValidation.isValid
                }
              >
                {getNicknameButtonText()}
              </button>
            </div>
            {nicknameValidation.message && (
              <div
                className={`${info.validationMessage} ${
                  nicknameValidation.isValid ? info.success : info.error
                }`}
              >
                {nicknameValidation.message}
              </div>
            )}
          </div>
          <button
            type="submit"
            className={info.saveButton}
            disabled={isLoading}
          >
            {isLoading ? "수정 중..." : "수정 완료"}
          </button>
        </form>
      </div>

      {/* ModalUtil Modal */}
      <Modal
        show={modalState.show}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        onClose={hideModal}
      />
    </div>
  );
};

export default MyInfoPage;