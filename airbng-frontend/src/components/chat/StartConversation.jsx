import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOrCreateConversation, sendTextByRest, fetchOnlineUsers } from '../../api/chatApi';
import useOnlineUsersInfinite from '../../hooks/useOnlineUsersInfinite';
import usePresencePing from '../../hooks/usePresencePing';
import { v4 as uuid } from 'uuid';

export default function StartConversation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // 입력을 “ID 또는 닉네임”으로 통합
  const [peerKey, setPeerKey] = useState('');    // <- 숫자(아이디) 또는 문자열(닉네임)
  const [firstText, setFirstText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [keyword, setKeyword] = useState('');

  // 25초 간격 핑(30초 버킷 맞춤)
  usePresencePing({ intervalMs: 25000 });

  const {
    items: onlineUsers,
    byId,
    loading: listLoading,
    error: listError,
    containerRef,
    sentinelRef,
  } = useOnlineUsersInfinite({ search: keyword, size: 20, includeMe: false, autoRefreshMs: 15000 });

  useEffect(() => {
    const p = params.get('peerId');      // 쿼리에 id가 오면 그대로 사용
    const n = params.get('nickname');    // 쿼리에 nickname이 오면 우선 사용
    const t = params.get('firstText');
    if (n) setPeerKey(n);
    else if (p) setPeerKey(p);
    if (t) setFirstText(t);
  }, [params]);

  const selectedUser = useMemo(() => {
    const idNum = Number(peerKey);
    if (Number.isFinite(idNum) && idNum > 0) {
      return byId.get(idNum) || null;
    }
    // 닉네임으로 입력 중인 경우, 현재 화면의 온라인 목록에서 미리 보여주기
    const trimmed = String(peerKey || '').trim().toLowerCase();
    if (!trimmed) return null;
    return onlineUsers.find(
      u => (u.nickname || '').toLowerCase() === trimmed
    ) || null;
  }, [peerKey, byId, onlineUsers]);

  // 닉네임으로 유저 찾기(온라인 우선, 없으면 서버에 한 번 더 질의)
  const resolveByNickname = useCallback(async (nick) => {
    const q = String(nick || '').trim();
    if (!q) return null;

    // 1) 메모리(현재 로드된 온라인 목록)에서 완전 일치
    const localHit = onlineUsers.find(
      u => (u.nickname || '').toLowerCase() === q.toLowerCase()
    );
    if (localHit) return localHit;

    // 2) 서버 쿼리(온라인 사용자 도메인)
    try {
      const server = await fetchOnlineUsers({ limit: 5, q });
      const exact = (Array.isArray(server) ? server : []).find(
        u => (u.nickname || '').toLowerCase() === q.toLowerCase()
      );
      if (exact) return exact;
      // 완전 일치가 없으면 첫 결과라도 반환할지 말지는 정책 선택 — 여기선 엄격 모드라 null
      return null;
    } catch {
      return null;
    }

    // 오프라인까지 포함해 전역 닉네임 검색을 원하면:
    // try { const user = await lookupMemberByNickname(q); return user; } catch { return null; }
  }, [onlineUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      let targetId = null;
      const key = String(peerKey || '').trim();

      // 숫자면 ID로
      if (/^\d+$/.test(key)) {
        targetId = Number(key);
      } else {
        // 닉네임으로 해석
        const user = await resolveByNickname(key);
        if (!user) {
          throw new Error('해당 닉네임의 온라인 사용자를 찾지 못했어요.');
        }
        targetId = user.id;
      }

      if (!targetId || targetId < 1) {
        throw new Error('상대 사용자 식별값이 올바르지 않습니다.');
      }

      const conv = await getOrCreateConversation(targetId);
      const convId = conv?.convId || conv?.id;
      if (!convId) throw new Error('대화방 생성/조회에 실패했습니다.');

      const t = firstText.trim();
      if (t) await sendTextByRest(convId, { text: t, msgId: uuid() });

      // 네비게이션 시 카드 정보 같이 넘기기(닉네임 우선)
      const card =
        selectedUser ||
        onlineUsers.find(u => u.id === targetId) || null;

      navigate(`/page/chat/${convId}`, {
        replace: true,
        state: {
          peerName: card?.nickname || card?.name,     // ← 닉네임 우선
          peerNickname: card?.nickname,
          peerProfileUrl: card?.imageUrl,
        }
      });
    } catch (e2) {
      const status = e2?.response?.status;
      if (status === 400) setErr('본인과는 대화를 시작할 수 없습니다.');
      else if (status === 404) setErr('상대 사용자를 찾을 수 없습니다.');
      else setErr(e2?.response?.data?.message || e2?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePick = (u) => setPeerKey(String(u.nickname || u.id));
  const handleQuickStart = async (u) => {
    if (loading) return;
    setPeerKey(String(u.nickname || u.id));
    setFirstText('');
    await handleSubmit({ preventDefault() {} });
  };

  return (
    <section className="start-chat">
      <div className="start-chat__grid">
        {/* 위쪽: 온라인 사용자 */}
        <aside className="start-chat__aside">
          <div className="start-chat__aside-header">
            <h5 className="start-chat__title">온라인 사용자</h5>
            <input
              className="input"
              placeholder="이름/닉네임 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={loading}
            />
          </div>

          {listError && <div className="start-chat__error">{listError}</div>}

          <div className="start-chat__scroll" ref={containerRef}>
            <ul className="user-list">
              {onlineUsers.map((u) => (
                <li
                  key={u.id}
                  className={`user-item ${String(u.id) === String(selectedUser?.id) ? 'is-selected' : ''}`}
                  onClick={() => handlePick(u)}
                >
                  <div className="user-avatar">
                    {u.imageUrl ? (
                      <img src={u.imageUrl} alt={u.nickname || u.name || `user-${u.id}`} />
                    ) : (
                      <div className="user-avatar__fallback">
                        {(u.nickname || u.name || 'U').slice(0, 1)}
                      </div>
                    )}
                    <span className="online-dot" />
                  </div>
                  <div className="user-meta">
                    <div className="user-name">{u.nickname || u.name || `사용자 ${u.id}`}</div>
                    <div className="user-sub">{u.name ? `#${u.id} · ${u.name}` : `#${u.id}`}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn--xs btn--ghost"
                    onClick={(e) => { e.stopPropagation(); handleQuickStart(u); }}
                  >
                    바로 대화
                  </button>
                </li>
              ))}

              {!listLoading && onlineUsers.length === 0 && (
                <li className="user-empty">온라인 사용자가 없습니다.</li>
              )}

              {/* 무한스크롤 센티넬 */}
              <li ref={sentinelRef} style={{ height: 1 }} />
            </ul>

            {listLoading && (
              <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                불러오는 중…
              </div>
            )}
          </div>
        </aside>

        {/* 아래쪽: 새 대화 시작 */}
        <form onSubmit={handleSubmit} className="start-chat__card">
          <h5 className="start-chat__title">새 대화 시작</h5>

          <div className="form-row">
            <label className="form-label">상대 ID 또는 닉네임</label>
            <input
              type="text"                 // ← number → text
              className="input"
              placeholder="예: 9 또는 nick123"
              value={peerKey}
              onChange={(e) => setPeerKey(e.target.value)}
              disabled={loading}
            />
            {selectedUser && (
              <div className="start-chat__selected">
                선택됨: <b>{selectedUser.nickname || selectedUser.name}</b> (#{selectedUser.id})
              </div>
            )}
          </div>

          <div className="form-row">
            <label className="form-label">첫 메시지 (선택)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="안녕하세요!"
              value={firstText}
              onChange={(e) => setFirstText(e.target.value)}
              disabled={loading}
            />
          </div>

          {err && <div className="start-chat__error">{err}</div>}

          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? '생성 중…' : '대화 시작'}
          </button>
        </form>
      </div>
    </section>
  );
}
