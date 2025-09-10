export default function EmptyState({ title="채팅방이 없습니다", action=null }) {
  return (
    <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>
      <p style={{ marginBottom: 12 }}>{title}</p>
      {action}
    </div>
  );
}
