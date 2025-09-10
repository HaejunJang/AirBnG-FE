export default function ChatMessage({ me, msg }) {
  const time = new Date(msg.sentAt ?? Date.now());
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');

  return (
    <div className={`d-flex ${me ? 'justify-content-end' : 'justify-content-start'} mb-2`}>
      <div className={`p-2 rounded-3 ${me ? 'bg-primary text-white' : 'bg-light'}`} style={{ maxWidth: '70%' }}>
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.text ?? (msg.attachments?.length ? '[첨부 파일]' : '')}
        </div>
        <div className="text-opacity-75" style={{ fontSize: 11, marginTop: 4, textAlign: me ? 'right' : 'left' }}>
          {`${hh}:${mm}`}
        </div>
      </div>
    </div>
  );
}
