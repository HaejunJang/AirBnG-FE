import { useEffect, useState } from 'react';
import { fetchInbox } from '../../api/chatApi';
import { Link } from 'react-router-dom';
import EmptyState from './EmptyState';

function LastPreview({ lastMessage }) {
  if (!lastMessage) return null;
  const txt = lastMessage.preview ?? lastMessage.text ?? '';
  return <div className="text-muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txt}</div>;
}

export default function ChatList() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    (async () => {
      const list = await fetchInbox({ page: 0, size: 50 }); // List<Inbox>
      setItems(Array.isArray(list) ? list : []);
    })();
  }, []);

  if (!items) return <div style={{ padding: 16 }}>불러오는 중…</div>;

  return (
     <>
      <div className="d-flex justify-content-end p-2">
        <Link to="/page/chat/new" className="btn btn-sm btn-primary">새 대화</Link>
      </div>

      {items.length === 0 ? (
        <EmptyState title="아직 대화가 없어요" action={<Link to="/page/chat/new" className="btn btn-primary">대화 시작</Link>} />
      ) : (
        <ul className="list-group">
          {items.map(inbox => (
            <li key={inbox.convId} className="list-group-item d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-circle bg-light" style={{ width: 40, height: 40 }} />
                <div>
                  <div className="fw-semibold">
                    {inbox.peerName ?? inbox.peerNickname ?? '상대'}{' '}
                    {inbox.cachedUnread > 0 && <span className="badge text-bg-danger ms-1">{inbox.cachedUnread}</span>}
                  </div>
                  <LastPreview lastMessage={inbox.lastMessage} />
                </div>
              </div>
              <Link className="btn btn-sm btn-outline-primary" to={`/page/chat/${inbox.convId}`}>열기</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
