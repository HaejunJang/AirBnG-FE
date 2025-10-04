import { useMemo } from "react";
import SettingsIcon from "../../assets/settings.svg";
import "../../styles/pages/manage.css";

function LockerSummaryCard({
  locker,
  onManage,   // 편집/관리 이동
  onDetail,   // 상세 이동 (필요 없으면 onManage 재사용)
  onToggle,   // 활성/중지 토글
  onDelete,   // 삭제 (선택)
}) {
  const isActive = useMemo(() => locker?.isAvailable === "YES", [locker]);
  const firstImage = locker?.images?.[0] || "";

  return (
    <div className="menu-section">
      <div className="menu-item-card">
        <div className="menu-item-content">
          <div className="locker-thumbnail">
            {firstImage ? (
              <img src={firstImage} alt="보관소 이미지" />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "#eee" }} />
            )}
          </div>

          <div className="locker-info">
            <div className="locker-title-row">
              <h3 className="locker-title">{locker?.lockerName}</h3>
              {isActive ? (
                <span className="status-badge active">운영중</span>
              ) : (
                <span className="status-badge inactive">중지됨</span>
              )}
              <button className="edit-locker-btn" onClick={onManage} title="편집">
                <img src={SettingsIcon} alt="편집" width={25} height={25} />
              </button>
            </div>

            <div className="locker-jim-types">
              {(locker?.jimTypeResults || []).map((t) => (
                <span key={t.jimTypeId} className="jim-type-badge">
                  {t.typeName} : ₩{t.pricePerHour}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="locker-action-buttons">
          <button className="manage-locker-btn" onClick={onDetail || onManage}>
            보관소 상세보기
          </button>

          {/* 필요시 노출 */}
          {/* <button className="delete-locker-btn" onClick={onDelete}>보관소 삭제하기</button> */}

          <button
            className={`toggle-btn ${isActive ? "btn-stop" : "btn-restart"}`}
            onClick={onToggle}
          >
            {isActive ? "보관소 중지" : "보관소 재개"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LockerSummaryCard;
