import EmptyIcon from "../../assets/locker_empty_ic.svg";

function EmptyLockerCTA({ onRegister }) {
  return (
    <div className="empty-locker-section">
      <div className="empty-locker-icon">
        <img src={EmptyIcon} alt="보관소 아이콘" />
      </div>
      <h2 className="empty-locker-title">보관소 등록</h2>
      <p className="empty-locker-subtext">

        <br />
        보관소 등록하러 가시겠습니까?
      </p>
      <button className="register-locker-btn" onClick={onRegister}>
        등록하기
      </button>
    </div>
  );
}

export default EmptyLockerCTA;
