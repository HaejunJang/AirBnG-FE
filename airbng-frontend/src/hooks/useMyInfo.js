import {useState, useEffect, useRef} from 'react';
import { infoApi, updateUserInfo } from '../api/infoApi';
import defaultImage from '../assets/img_upload_ic.svg';
import {httpAuth} from '../api/http';
import {useAuth} from "../context/AuthContext";
import {setUserProfile} from "../utils/jwtUtil";


export const useMyInfo = () => {
    const { setUser, updateUser } = useAuth();
    const [userInfo, setUserInfo] = useState({
        memberId: '',
        email: '',
        name: '',
        phone: '',
        nickname: '',
        profileImage: ''
    });

    const originalNicknameRef = useRef(null);
    const [profileImage, setProfileImage] = useState(null);
    const [profilePreview, setProfilePreview] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [nicknameValidation, setNicknameValidation] = useState({
        isChecked: false,
        isValid: false,
        message: ''
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // 사용자 정보 로드 - API 함수 사용
    const loadUserInfo = async (memberId) => {
        if (!memberId) {
            console.log('memberId가 없습니다');
            return;
        }

        console.log('사용자 정보 로드 시작, memberId:', memberId);
        setIsLoading(true);
        setError('');

        try {
            const response = await infoApi.getUserInfo(memberId);
            console.log('API 응답:', response);

            if (response.status === 200 && response.data.code === 1000) {
                const data = response.data.result;
                console.log('받은 사용자 정보:', data);
                setUserInfo(data);
                setProfilePreview(data.url || defaultImage);

                // 원본 닉네임 저장 (최초 1번만)
                if (originalNicknameRef.current === null) {
                    originalNicknameRef.current = data.nickname;
                }
            }
        } catch (err) {
            console.error('사용자 정보 로드 에러:', err);
            setError(err.message || '사용자 정보를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 프로필 이미지 변경 처리
    const handleProfileImageChange = (file) => {
        if (!file) return;

        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('파일 크기는 5MB 이하여야 합니다.');
            return;
        }

        // 파일 타입 체크
        if (!file.type.startsWith('image/')) {
            setError('이미지 파일만 업로드 가능합니다.');
            return;
        }

        setProfileImage(file);

        // 미리보기 생성
        const reader = new FileReader();
        reader.onload = (e) => {
            setProfilePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    // 닉네임 중복 확인 - httpAuth 사용
    const checkNicknameDuplicate = async () => {
        const nickname = userInfo.nickname?.trim();

        if (!nickname) {
            setNicknameValidation({
                isChecked: false,
                isValid: false,
                message: '닉네임을 입력해주세요.'
            });
            return;
        }

        if (nickname.length < 2 || nickname.length > 20) {
            setNicknameValidation({
                isChecked: false,
                isValid: false,
                message: '닉네임은 2글자 이상 20글자 이하여야 합니다.'
            });
            return;
        }

        try {
            // httpAuth import해서 사용
            const response = await httpAuth.get(`/members/check-nickname?nickname=${encodeURIComponent(nickname)}`);

            if (response.status === 200 && response.data.code === 1000) {
                // 백엔드가 문자열을 반환하므로 성공 메시지가 있으면 사용 가능
                setNicknameValidation({
                    isChecked: true,
                    isValid: true,
                    message: '사용 가능한 닉네임입니다.'
                });
            } else {
                throw new Error(response.data.message || '닉네임 확인에 실패했습니다.');
            }
        } catch (err) {
            console.error('닉네임 중복 확인 에러:', err);
            setNicknameValidation({
                isChecked: false,
                isValid: false,
                message: err.message || '닉네임 확인에 실패했습니다.'
            });
        }
    };

    // 닉네임 입력 시 검증 상태 초기화
    const resetNicknameValidation = () => {
        setNicknameValidation({
            isChecked: false,
            isValid: false,
            message: ''
        });
    };

    // 폼 유효성 검사
    const validateForm = () => {
        const { phone, nickname } = userInfo;

        if (!phone?.trim()) {
            setError('전화번호를 입력해주세요.');
            return false;
        }

        // 전화번호 형식 검증 (11자리 숫자)
        const phoneRegex = /^010\d{8}$/;
        if (!phoneRegex.test(phone.replace(/-/g, ''))) {
            setError('올바른 전화번호 형식이 아닙니다. (010으로 시작하는 11자리 숫자)');
            return false;
        }

        if (!nickname?.trim()) {
            setError('닉네임을 입력해주세요.');
            return false;
        }

        const isNicknameChanged = userInfo.nickname !== originalNicknameRef.current;

        if (isNicknameChanged && (!nicknameValidation.isChecked || !nicknameValidation.isValid)) {
            setError('닉네임 중복확인을 완료해주세요.');
            return false;
        }

        return true;
    };

    // 정보 수정 요청
    const updateUserInfoHandler = async () => {
        console.log('수정 완료 버튼 클릭됨');

        if (!validateForm()) {
            console.log('폼 검증 실패');
            return false;
        }

        console.log('폼 검증 성공, 수정 요청 시작');
        setIsLoading(true);
        setError('');

        try {
            const formData = new FormData();

            const memberUpdateRequest = {
                memberId: userInfo.memberId,
                email: userInfo.email,
                name: userInfo.name,
                phone: userInfo.phone,
                nickname: userInfo.nickname
            };

            formData.append(
                'memberUpdateRequest',
                new Blob([JSON.stringify(memberUpdateRequest)], { type: 'application/json' })
            );

            if (profileImage) {
                formData.append('profileImage', profileImage);
            }

            const response = await updateUserInfo(formData);
            console.log('API 응답:', response);

            if (response.status === 200 && response.data.code === 1000) {
                console.log('수정 성공');

                updateUser({
                    nickname: userInfo.nickname  // 수정된 닉네임으로 업데이트
                });

                setShowSuccessModal(true);
                return true;
            } else {
                throw new Error(response.data.message || '정보 수정에 실패했습니다.');
            }
        } catch (err) {
            console.error('수정 요청 에러:', err);
            setError(err.message || '정보 수정에 실패했습니다.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // const updateUserInfoHandler2 = async () => {
    //     console.log('수정 완료 버튼 클릭됨');
    //
    //     if (!validateForm()) {
    //         console.log('폼 검증 실패');
    //         return false;
    //     }
    //
    //     console.log('폼 검증 성공, 수정 요청 시작');
    //     setIsLoading(true);
    //     setError('');
    //
    //     try {
    //         const formData = new FormData();
    //
    //         const memberUpdateRequest = {
    //             memberId: userInfo.memberId,
    //             email: userInfo.email,
    //             name: userInfo.name,
    //             phone: userInfo.phone,
    //             nickname: userInfo.nickname
    //         };
    //
    //         formData.append(
    //             'memberUpdateRequest',
    //             new Blob([JSON.stringify(memberUpdateRequest)], { type: 'application/json' })
    //         );
    //
    //         if (profileImage) {
    //             formData.append('profileImage', profileImage);
    //         }
    //
    //         const response = await updateUserInfo(formData);
    //         console.log('API 응답:', response);
    //
    //         if (response.status === 200 && response.data.code === 1000) {
    //             console.log('수정 성공');
    //
    //             // AuthContext + 로컬스토리지 업데이트
    //             setUser(prevUser => {
    //                 const updatedUser = {
    //                     ...prevUser,
    //                     name: userInfo.nickname, // nickname 통일!
    //                 };
    //
    //                 setUserProfile({
    //                     id: userInfo.memberId,
    //                     nickname: userInfo.nickname,
    //                     roles: updatedUser.roles || []
    //                 });
    //
    //                 return updatedUser;
    //             });
    //
    //             setShowSuccessModal(true);
    //             return true;
    //         } else {
    //             throw new Error(response.data.message || '정보 수정에 실패했습니다.');
    //         }
    //     } catch (err) {
    //         console.error('수정 요청 에러:', err);
    //         setError(err.message || '정보 수정에 실패했습니다.');
    //         return false;
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };


    // 입력값 업데이트
    const updateUserField = (field, value) => {
        setUserInfo(prev => ({ ...prev, [field]: value }));
        setError(''); // 에러 메시지 초기화
    };

    // 전화번호 포맷팅 함수 (숫자만 입력받아서 010-0000-0000 형태로 변환)
    const formatPhoneNumber = (value) => {
        // 숫자만 추출
        const phoneNumber = value.replace(/[^\d]/g, '');

        // 길이에 따라 포맷팅
        if (phoneNumber.length <= 3) {
            return phoneNumber;
        } else if (phoneNumber.length <= 7) {
            return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
        } else {
            return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
        }
    };

    // 전화번호 업데이트 함수
    const updatePhoneField = (value) => {
        const formattedPhone = formatPhoneNumber(value);
        setUserInfo(prev => ({...prev, phone: formattedPhone}));
        setError('');
    };

    return {
        userInfo,
        profilePreview,
        isLoading,
        error,
        nicknameValidation,
        showSuccessModal,
        isNicknameChanged: userInfo.nickname !== originalNicknameRef.current,
        loadUserInfo,
        handleProfileImageChange,
        checkNicknameDuplicate,
        resetNicknameValidation,
        updateUserInfo: updateUserInfoHandler,
        updateUserField,
        updatePhoneField,
        setError,
        setShowSuccessModal
    };
};