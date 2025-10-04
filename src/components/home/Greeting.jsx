import React from 'react';
import { useAuth } from '../../context/AuthContext';

function Greeting() {
    const { user, setUser } = useAuth();
    // nickname 필드를 사용하도록 수정
    const nickname = user?.nickname || '';

    console.log("Greeting user:", user);
    console.log("Greeting nickname:", nickname);

    return (
        <div className="greeting">
            {nickname ? (
                <>반갑습니다 <span className="nickname">{nickname}님.</span></>
            ) : (
                <span className="hello">Welcome, AirBnG!</span>
            )}
            <div className="greeting-ring"></div>
            <div className="greeting-ring-inner"></div>
        </div>
    );
}

export default Greeting;