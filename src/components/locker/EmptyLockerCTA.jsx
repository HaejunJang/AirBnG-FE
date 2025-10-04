import EmptyIcon from "../../assets/locker_empty_ic.svg";

function EmptyLockerCTA({ onRegister, canRegister = true }) {
  return (
    <div className="empty-locker-section">
      <div className="empty-locker-icon">
        <img src={EmptyIcon} alt="보관소 아이콘" />
      </div>
      <h2 className="empty-locker-title">보관소 등록</h2>
      
      {canRegister ? (
        <p className="empty-locker-subtext">
          <br />
          보관소 등록하러 가시겠습니까?
        </p>
      ) : (
        <p className="empty-locker-subtext">
          심사 중인 보관소가 있습니다.
          <br />
          심사를 기다려주세요.
        </p>
      )}
      
      <button 
        className={`register-locker-btn ${!canRegister ? 'disabled' : ''}`} 
        onClick={canRegister ? onRegister : undefined}
        disabled={!canRegister}
      >
        {canRegister ? '등록하기' : '심사 대기 중'}
      </button>
    </div>
  );
}

export default EmptyLockerCTA;
