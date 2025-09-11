import React, { useRef } from 'react';
import info from '../../styles/pages/myInfo.module.css';
import defaultImage from '../../assets/img_upload_ic.svg';

const ProfileImageUpload = ({ profilePreview, onImageChange }) => {
    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onImageChange(file);
        }
    };

    return (
        <div className={info.profileSection}>
            <div className={info.profileImageContainer}>
                <img
                    src={profilePreview || defaultImage}
                    alt="프로필 이미지"
                    className={info.profileImage}
                    onClick={handleClick}
                />
                <div className={info.profileUploadBtn} onClick={handleClick}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                    </svg>
                </div>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            <p className={info.profileText}>프로필 사진을 변경하려면 클릭하세요</p>
        </div>
    );
};

export default ProfileImageUpload;