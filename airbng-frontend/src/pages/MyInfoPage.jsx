import React, {useEffect, useMemo, useRef} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMyInfo } from '../hooks/useMyInfo';
import ProfileImageUpload from '../components/info/ProfileImageUpload';
import LoadingSpinner from '../components/info/LoadingSpinner';
import ErrorMessage from '../components/info/ErrorMessage';
import SuccessModal from '../components/info/SuccessModal';
import info from '../styles/pages/myInfo.module.css';
import {getCurrentUserIdFromToken, useAuth} from '../context/AuthContext';

const MyInfoPage = () => {
    const navigate = useNavigate();
    const {user, isLoggedIn} = useAuth();
    // const urlMemberId = searchParams.get('memberId');

    const {
        userInfo,
        profilePreview,
        isLoading,
        error,
        nicknameValidation,
        showSuccessModal,
        isNicknameChanged,
        loadUserInfo,
        handleProfileImageChange,
        checkNicknameDuplicate,
        resetNicknameValidation,
        updateUserInfo,
        updateUserField,
        updatePhoneField,
        setError,
        setShowSuccessModal
    } = useMyInfo();

    // 원래 닉네임 저장 → 닉네임이 바뀌었는지 비교
    //const originalNicknameRef = useRef(null);

    // memberId로 사용자 정보 로드 후 최초 1번만 원래 닉네임 저장
    //1) memberId로 사용자 정보 로드


    // 2) 원래 닉네임 저장 (최초 1번만)
    // useEffect(() => {
    //     if (userInfo?.nickname && originalNicknameRef.current === null) {
    //         originalNicknameRef.current = userInfo.nickname;
    //     }
    // }, [userInfo?.nickname]);


    // 닉네임이 바뀌었는지 여부 확인
    //const isNicknameChanged = userInfo.nickname !== originalNicknameRef.current;
    useEffect(() => {
        console.log('로그인 상태:', isLoggedIn);
        console.log('사용자 정보:', user);

        if (!isLoggedIn || !user?.id) {
            alert('로그인이 필요합니다.');
            navigate('/page/home');
            return;
        }

        // 사용자 정보 로드
        loadUserInfo(user.id);
    }, [isLoggedIn, user, navigate]);


    const handleBack = () => {
        navigate(-1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 닉네임이 바뀌었는데 중복검사를 안 했다면 막기
        if (isNicknameChanged && !nicknameValidation.isValid) { // 이 조건을 수정
            setError('닉네임 중복 확인을 해주세요.');
            return;
        }

        const success = await updateUserInfo();
        if (success) {
            setShowSuccessModal(true);
        }
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        navigate('/page/mypage');
    };

    const getNicknameButtonText = () => {
        if (nicknameValidation.isValid) return '확인완료';
        return '중복확인';
    };

    const getNicknameButtonClass = () => {
        let baseClass = info.checkButton;
        if (nicknameValidation.isValid) baseClass += ` ${info.success}`;
        return baseClass;
    };

    const getNicknameInputClass = () => {
        let baseClass = info.formInput;
        if (nicknameValidation.message) {
            baseClass += nicknameValidation.isValid ? ` ${info.success}` : ` ${info.error}`;
        }
        return baseClass;
    };

    return (
        <div className={info.pageContainer}>
            <button className={info.backButton} onClick={handleBack}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
            </button>

            <div className={info.editProfileContainer}>
                <div className={info.editProfileHeader}>
                    <h1 className={info.editProfileTitle}>내 정보 수정</h1>
                    <p className={info.editProfileSubtitle}>개인정보를 안전하게 수정하세요</p>
                </div>

                <ProfileImageUpload
                    profilePreview={profilePreview}
                    onImageChange={handleProfileImageChange}
                />

                <ErrorMessage
                    message={error}
                    onClose={() => setError('')}
                />

                <LoadingSpinner
                    isVisible={isLoading}
                    message="정보를 불러오는 중..."
                />

                <form className={info.editProfileForm} onSubmit={handleSubmit}>
                    {/* 이메일 필드 */}
                    <div className={info.inputGroup}>
                        <label className={info.inputLabel}>이메일</label>
                        <div className={info.inputRow}>
                            <input
                                type="email"
                                className={info.formInput}
                                value={userInfo.email || ''}
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
                                value={userInfo.name || ''}
                                onChange={e => updateUserField('name', e.target.value)}
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
                                value={userInfo.phone || ''}
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
                                value={userInfo.nickname || ''}
                                onChange={(e) => {
                                    updateUserField('nickname', e.target.value);
                                    resetNicknameValidation();
                                }}
                                placeholder="닉네임을 입력하세요"
                                required
                            />
                            <button
                                type="button"
                                className={getNicknameButtonClass()}
                                onClick={checkNicknameDuplicate}
                                disabled={!userInfo.nickname?.trim() || nicknameValidation.isValid}
                            >
                                {getNicknameButtonText()}
                            </button>
                        </div>
                        {nicknameValidation.message && (
                            <div
                                className={`${info.validationMessage} ${nicknameValidation.isValid ? info.success : info.error}`}>
                                {nicknameValidation.message}
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className={info.saveButton}
                        disabled={isLoading}
                    >
                        {isLoading ? '수정 중...' : '수정 완료'}
                    </button>
                </form>
            </div>

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={handleSuccessModalClose}
                title="수정 완료!"
                message="정보가 성공적으로 수정되었습니다."
            />
        </div>
    );
};

export default MyInfoPage;
