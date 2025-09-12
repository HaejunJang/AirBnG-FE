export default function EmptyState({ title="채팅방이 없습니다", action=null }) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
