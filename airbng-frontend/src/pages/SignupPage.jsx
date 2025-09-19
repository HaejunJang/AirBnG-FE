import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signupApi } from "../api/signupApi";
import { Modal, useModal } from "../components/common/ModalUtil";
import signup from "../styles/pages/signUp.module.css";

function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectUrl =
    new URLSearchParams(location.search).get("redirect") || "";

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    nickname: "",
    password: "",
    passwordConfirm: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(
    "https://airbngbucket.s3.ap-northeast-2.amazonaws.com/profiles/8e99db50-0a6c-413e-a42c-c5213dc9d64a_default.jpg"
  );

  const [validationStates, setValidationStates] = useState({
    email: { message: "", type: "", checked: false },
    nickname: { message: "", type: "", checked: false },
    password: { message: "", type: "" },
    passwordConfirm: { message: "", type: "" },
  });

  const [buttonStates, setButtonStates] = useState({
    emailCheck: { loading: false, success: false },
    nicknameCheck: { loading: false, success: false },
    signup: { loading: false },
  });

  const { modalState, showSuccess, showError, hideModal } = useModal();

  const goBack = () => {
    navigate(-1);
  };

  const goToLogin = () => {
    navigate(`/page/login?redirect=${redirectUrl}`);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "email" || field === "nickname") {
      resetValidation(field);
    }

    if (field === "phone") {
      const cleanValue = value.replace(/\D/g, "");
      let formattedValue = cleanValue;

      if (cleanValue.length >= 4 && cleanValue.length < 8) {
        formattedValue = `${cleanValue.slice(0, 3)}-${cleanValue.slice(3)}`;
      } else if (cleanValue.length >= 8) {
        formattedValue = `${cleanValue.slice(0, 3)}-${cleanValue.slice(
          3,
          7
        )}-${cleanValue.slice(7, 11)}`;
      }

      setFormData((prev) => ({ ...prev, [field]: formattedValue }));
      return;
    }

    if (field === "password") {
      if (value) {
        const error = validatePassword(value);
        showValidationMessage(
          "password",
          error || "사용 가능한 비밀번호입니다.",
          error ? "error" : "success"
        );
      } else {
        clearValidationMessage("password");
      }
    }

    if (field === "passwordConfirm") {
      if (value) {
        const isMatch = formData.password === value;
        showValidationMessage(
          "passwordConfirm",
          isMatch ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다.",
          isMatch ? "success" : "error"
        );
      } else {
        clearValidationMessage("passwordConfirm");
      }
    }
  };

  const resetValidation = (field) => {
    setValidationStates((prev) => ({
      ...prev,
      [field]: { message: "", type: "", checked: false },
    }));

    setButtonStates((prev) => ({
      ...prev,
      [`${field}Check`]: { loading: false, success: false },
    }));
  };

  const showValidationMessage = (field, message, type) => {
    setValidationStates((prev) => ({
      ...prev,
      [field]: { ...prev[field], message, type },
    }));
  };

  const clearValidationMessage = (field) => {
    setValidationStates((prev) => ({
      ...prev,
      [field]: { ...prev[field], message: "", type: "" },
    }));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);

    if (password.length < minLength) {
      return "비밀번호는 8자 이상이어야 합니다.";
    }
    if (!hasUpper || !hasLower) {
      return "대문자와 소문자를 모두 포함해야 합니다.";
    }
    if (!hasDigit) {
      return "숫자를 포함해야 합니다.";
    }
    return null;
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setProfileImage(file);
    }
  };

  const checkEmailDuplicate = async () => {
    const email = formData.email.trim();

    if (!email) {
      showValidationMessage("email", "이메일을 입력해주세요.", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showValidationMessage("email", "올바른 이메일 형식이 아닙니다.", "error");
      return;
    }

    setButtonStates((prev) => ({
      ...prev,
      emailCheck: { loading: true, success: false },
    }));

    try {
      const result = await signupApi.checkEmailDuplicate(email);

      if (result.code === 1000) {
        showValidationMessage("email", "사용 가능한 이메일입니다.", "success");
        setValidationStates((prev) => ({
          ...prev,
          email: { ...prev.email, checked: true },
        }));
        setButtonStates((prev) => ({
          ...prev,
          emailCheck: { loading: false, success: true },
        }));
      } else {
        showValidationMessage(
          "email",
          result.message || "이미 사용 중인 이메일입니다.",
          "error"
        );
      }
    } catch (error) {
      console.error("이메일 중복 검사 오류:", error);
      showValidationMessage(
        "email",
        error.message || "서버 오류로 이메일 확인에 실패했습니다.",
        "error"
      );
    } finally {
      setButtonStates((prev) => ({
        ...prev,
        emailCheck: { ...prev.emailCheck, loading: false },
      }));
    }
  };

  const checkNicknameDuplicate = async () => {
    const nickname = formData.nickname.trim();

    if (!nickname) {
      showValidationMessage("nickname", "닉네임을 입력해주세요.", "error");
      return;
    }

    if (nickname.length < 2) {
      showValidationMessage(
        "nickname",
        "닉네임은 2자 이상이어야 합니다.",
        "error"
      );
      return;
    }

    setButtonStates((prev) => ({
      ...prev,
      nicknameCheck: { loading: true, success: false },
    }));

    try {
      const result = await signupApi.checkNicknameDuplicate(nickname);

      if (result.code === 1000) {
        showValidationMessage(
          "nickname",
          "사용 가능한 닉네임입니다.",
          "success"
        );
        setValidationStates((prev) => ({
          ...prev,
          nickname: { ...prev.nickname, checked: true },
        }));
        setButtonStates((prev) => ({
          ...prev,
          nicknameCheck: { loading: false, success: true },
        }));
      } else {
        showValidationMessage(
          "nickname",
          "이미 사용 중인 닉네임입니다.",
          "error"
        );
      }
    } catch (error) {
      console.error("닉네임 중복 검사 오류:", error);
      showValidationMessage(
        "nickname",
        error.message || "서버 오류로 닉네임 확인에 실패했습니다.",
        "error"
      );
    } finally {
      setButtonStates((prev) => ({
        ...prev,
        nicknameCheck: { ...prev.nicknameCheck, loading: false },
      }));
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    const { email, name, phone, nickname, password, passwordConfirm } =
      formData;

    if (
      !email ||
      !name ||
      !phone ||
      !nickname ||
      !password ||
      !passwordConfirm
    ) {
      showError("오류", "모든 필드를 입력해주세요.");
      return;
    }

    if (!validationStates.email.checked) {
      showError("오류", "이메일 중복 확인을 해주세요.");
      return;
    }

    if (!validationStates.nickname.checked) {
      showError("오류", "닉네임 중복 확인을 해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      showError("오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      showError("오류", passwordError);
      return;
    }

    setButtonStates((prev) => ({
      ...prev,
      signup: { loading: true },
    }));

    try {
      const phoneNumber = phone.replace(/-/g, "");
      const memberData = {
        email,
        name,
        phone: phoneNumber,
        nickname,
        password,
      };

      const result = await signupApi.signup(memberData, profileImage);

      if (result.code === 1000) {
        showSuccess("회원가입 완료!", "AirBnG에 오신 것을 환영합니다!", () => {
          navigate("/page/login");
        });
      } else {
        showError(
          "회원가입 실패",
          result.message || "회원가입에 실패했습니다."
        );
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      showError(
        "회원가입 실패",
        error.message || "서버 오류로 회원가입에 실패했습니다."
      );
    } finally {
      setButtonStates((prev) => ({
        ...prev,
        signup: { loading: false },
      }));
    }
  };

  return (
    <div className={signup.signupPageContainer}>
      <button className={signup.signupBackButton} onClick={goBack}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          ></path>
        </svg>
      </button>

      <div className={signup.signupContainer}>
        <div className={signup.signupHeader}>
          <h1 className={signup.signupTitle}>회원가입</h1>
          <p className={signup.signupSubtitle}>AirBnG에 오신 것을 환영합니다</p>
        </div>

        <div className={signup.profileSection}>
          <div className={signup.profileImageContainer}>
            <img
              id="profile-preview"
              src={profilePreview}
              alt="프로필 이미지"
              className={signup.profileImage}
              onClick={() => document.getElementById("profile-input").click()}
            />
            <div
              className={signup.profileUploadBtn}
              onClick={() => document.getElementById("profile-input").click()}
              title="프로필 사진 변경"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
          <input
            type="file"
            id="profile-input"
            accept="image/*"
            onChange={handleProfileImageChange}
            style={{ display: "none" }}
          />
          <p className={signup.profileText}>
            프로필 사진을 설정해주세요 (선택사항)
          </p>
        </div>

        <form className={signup.signupForm} onSubmit={handleSignup}>
          <div className={signup.inputGroup}>
            <label className={signup.inputLabel}>이메일</label>
            <div className={signup.inputRow}>
              <input
                type="email"
                className={`${signup.formInput} ${
                  validationStates.email.type === "success"
                    ? signup.success
                    : validationStates.email.type === "error"
                    ? signup.error
                    : ""
                }`}
                placeholder="이메일을 입력하세요"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
              <button
                type="button"
                className={`${signup.checkButton} ${
                  buttonStates.emailCheck.success ? "success" : ""
                }`}
                onClick={checkEmailDuplicate}
                disabled={buttonStates.emailCheck.loading}
              >
                {buttonStates.emailCheck.loading
                  ? "확인중..."
                  : buttonStates.emailCheck.success
                  ? "확인완료"
                  : "중복확인"}
              </button>
            </div>
            {validationStates.email.message && (
              <div
                className={`${signup.validationMessage} ${
                  validationStates.email.type === "success"
                    ? signup.success
                    : validationStates.email.type === "error"
                    ? signup.error
                    : ""
                }`}
              >
                {validationStates.email.message}
              </div>
            )}
          </div>

          <div className={signup.inputGroup}>
            <label className={signup.inputLabel}>이름</label>
            <div className={signup.inputRow}>
              <input
                type="text"
                className={signup.formInput}
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
          </div>

          <div className={signup.inputGroup}>
            <label className={signup.inputLabel}>전화번호</label>
            <div className={signup.inputRow}>
              <input
                type="tel"
                className={signup.formInput}
                placeholder="휴대폰 번호 입력('-'제외 11자리 입력)"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>
          </div>

          <div className={signup.inputGroup}>
            <label className={signup.inputLabel}>닉네임</label>
            <div className={signup.inputRow}>
              <input
                type="text"
                className={`${signup.formInput} ${
                  validationStates.nickname.type === "success"
                    ? signup.success
                    : validationStates.nickname.type === "error"
                    ? signup.error
                    : ""
                }`}
                placeholder="닉네임을 입력하세요"
                value={formData.nickname}
                onChange={(e) => handleInputChange("nickname", e.target.value)}
                required
              />
              <button
                type="button"
                className={`${signup.checkButton} ${
                  buttonStates.nicknameCheck.success ? "success" : ""
                }`}
                onClick={checkNicknameDuplicate}
                disabled={buttonStates.nicknameCheck.loading}
              >
                {buttonStates.nicknameCheck.loading
                  ? "확인중..."
                  : buttonStates.nicknameCheck.success
                  ? "확인완료"
                  : "중복확인"}
              </button>
            </div>
            {validationStates.nickname.message && (
              <div
                className={`${signup.validationMessage} ${
                  validationStates.nickname.type === "success"
                    ? signup.success
                    : validationStates.nickname.type === "error"
                    ? signup.error
                    : ""
                }`}
              >
                {validationStates.nickname.message}
              </div>
            )}
          </div>

          <div className={signup.inputGroup}>
            <label className={signup.inputLabel}>비밀번호</label>
            <div className={signup.inputRow}>
              <input
                type="password"
                className={`${signup.formInput} ${
                  validationStates.password.type === "success"
                    ? signup.success
                    : validationStates.password.type === "error"
                    ? signup.error
                    : ""
                }`}
                placeholder="대/소문자/숫자 하나 이상을 포함하여 8자 이상"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
              />
            </div>
            {validationStates.password.message && (
              <div
                className={`${signup.validationMessage} ${
                  validationStates.password.type === "success"
                    ? signup.success
                    : validationStates.password.type === "error"
                    ? signup.error
                    : ""
                }`}
              >
                {validationStates.password.message}
              </div>
            )}
          </div>

          <div className={signup.inputGroup}>
            <label className={signup.inputLabel}>비밀번호 확인</label>
            <div className={signup.inputRow}>
              <input
                type="password"
                className={`${signup.formInput} ${
                  validationStates.passwordConfirm.type === "success"
                    ? signup.success
                    : validationStates.passwordConfirm.type === "error"
                    ? signup.error
                    : ""
                }`}
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.passwordConfirm}
                onChange={(e) =>
                  handleInputChange("passwordConfirm", e.target.value)
                }
                required
              />
            </div>
            {validationStates.passwordConfirm.message && (
              <div
                className={`${signup.validationMessage} ${
                  validationStates.passwordConfirm.type === "success"
                    ? signup.success
                    : validationStates.passwordConfirm.type === "error"
                    ? signup.error
                    : ""
                }`}
              >
                {validationStates.passwordConfirm.message}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={signup.signupButton}
            disabled={buttonStates.signup.loading}
          >
            {buttonStates.signup.loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div className={signup.loginSection}>
          <span className={signup.loginText}>이미 계정이 있으신가요? </span>
          <button
            type="button"
            className={signup.loginLink}
            onClick={goToLogin}
          >
            로그인
          </button>
        </div>
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
}

export default SignUpPage;
