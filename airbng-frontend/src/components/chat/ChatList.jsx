import { useCallback, useEffect, useState } from 'react';
import { fetchInbox } from '../../api/chatApi';
import { useNavigate } from 'react-router-dom';
import EmptyState from './EmptyState';
import '../../styles/chat.css';

function LastPreview({ lastMessage }) {
  if (!lastMessage) return null;
  const txt = lastMessage.preview ?? lastMessage.text ?? '';
  return <div className="chat-item__preview">{txt}</div>;
}

export default function ChatList() {
  const [items, setItems] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const list = await fetchInbox({ page: 0, size: 50 });
    setItems(Array.isArray(list) ? list : []);
  }, []);
  useEffect(() => {load();}, [load]);

  // 탭이 다시 포커스될 때 새로고침
  useEffect(() => {
    const onFocus = () => load();
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [load]);

  // 채팅방에서 쏜 힌트/읽음 이벤트로 즉시 반영
  useEffect(() => {
    const onHint = (e) => {
      const { convId, preview, sentAt, fromMe, unreadTotal } = e.detail || {};
      setItems((prev) => {
        if (!Array.isArray(prev)) return prev;
        const idx = prev.findIndex(it => it.convId === convId);
        if (idx < 0) { load(); return prev; } // 목록에 없으면 전체 새로고침
        const arr = prev.slice();
        const target = arr[idx];
        const last = target.lastMessage || {};
        const next = {
          ...target,
          lastMessage: { ...last, preview: preview ?? last.preview ?? last.text, text: preview ?? last.text, sentAt: sentAt ?? last.sentAt },
          cachedUnread: (unreadTotal != null) ? unreadTotal : Math.max(0, (target.cachedUnread || 0) + 1),
        };
        // 최신으로 끌어올리기
        arr.splice(idx, 1);
        arr.unshift(next);
        return arr;
      });
    };
    const onRead = (e) => {
      const { convId } = e.detail || {};
      setItems((prev) => Array.isArray(prev)
        ? prev.map(it => it.convId === convId ? { ...it, cachedUnread: 0 } : it)
        : prev);
    };
    window.addEventListener('inbox:hint', onHint);
    window.addEventListener('inbox:read', onRead);
    return () => {
      window.removeEventListener('inbox:hint', onHint);
      window.removeEventListener('inbox:read', onRead);
    };
  }, [load]);

  if (!items) return <div style={{ padding: 16 }}>불러오는 중…</div>;

  return (
    <>
    {items.length === 0 ? (
      <EmptyState
        title="아직 대화가 없어요"
        action={<button className="btn btn--primary" onClick={() => navigate('/page/chat/new')}>대화 시작</button>}
      />
    ) : (
      <ul className="chat-list chat-list--full">
        {items.map(inbox => {
          const name = inbox.peerName ?? inbox.peerNickname ?? '상대';
          const initial = (name || '상').slice(0, 1);
          const open = () =>
            navigate(`/page/chat/${inbox.convId}`, { state: { peerName: name } });

          return (
            <li
              key={inbox.convId}
              className="chat-item"
              role="button"
              tabIndex={0}
              onClick={open}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open()}
            >
              <div className="chat-item__avatar">{initial}</div>

              <div className="chat-item__main">
                <div className="chat-item__name">{name}</div>
                <LastPreview lastMessage={inbox.lastMessage} />
              </div>

              <div className="chat-item__meta">
                {inbox.cachedUnread > 0 && (
                  <div className="chat-item__badge">{inbox.cachedUnread}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    )}

    <button className="fab fab--primary" onClick={() => navigate('/page/chat/new')} aria-label="새 대화">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  </>
  );
}
