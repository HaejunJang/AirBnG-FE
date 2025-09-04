import React from 'react';
import { useAuth } from '../../context/AuthContext';

function Greeting() {
  const { user } = useAuth();
  const nickname = user?.name || '';

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