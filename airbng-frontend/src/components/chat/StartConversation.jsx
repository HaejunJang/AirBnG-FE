import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getOrCreateConversation,
  sendTextByRest,
  lookupUserByNickname,
  getDirectoryUser,
  suggestUsers,
} from '../../api/chatApi';
import useOnlineUsersInfinite from '../../hooks/useOnlineUsersInfinite';
import usePresencePing from '../../hooks/usePresencePing';
import { v4 as uuid } from 'uuid';

export default function StartConversation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // 입력을 “ID 또는 닉네임”으로 통합
  const [peerKey, setPeerKey] = useState('');
  const [firstText, setFirstText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [keyword, setKeyword] = useState('');

  // 오프라인 포함 미리보기/조회상태
  const [offlineCard, setOfflineCard] = useState(null);
  const [resolving, setResolving] = useState(false);

  // 자동완성 상태
  const [suggest, setSuggest] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);

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
    const p = params.get('peerId');
    const n = params.get('nickname');
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
    const trimmed = String(peerKey || '').trim().toLowerCase();
    if (!trimmed) return null;
    return onlineUsers.find(u => (u.nickname || '').toLowerCase() === trimmed) || null;
  }, [peerKey, byId, onlineUsers]);

  // Directory 카드 → 온라인목록 형태로 정규화
  const normalizeCard = useCallback((c) => {
    if (!c) return null;
    return { id: c.id, name: c.name, nickname: c.nickname, imageUrl: c.imageUrl, state: c.state };
  }, []);

  // 닉네임으로 유저 찾기 (온라인 완전일치 → 디렉토리 조회)
  const resolveByNickname = useCallback(
    async (nick) => {
      const q = String(nick || '').trim();
      if (!q) return null;
      const localHit = onlineUsers.find(u => (u.nickname || '').toLowerCase() === q.toLowerCase());
      if (localHit) return localHit;
      try {
        const card = await lookupUserByNickname(q);
        return normalizeCard(card);
      } catch {
        return null;
      }
    },
    [onlineUsers, normalizeCard]
  );

  // 입력값이 온라인에 없으면 디렉토리(ID/닉네임)로 디바운스 조회 → 오프라인 미리보기
  useEffect(() => {
    let cancelled = false;
    setOfflineCard(null);

    const key = String(peerKey || '').trim();
    if (!key) return;
    if (selectedUser) return; // 온라인 완전일치면 미리보기 불필요

    const run = async () => {
      setResolving(true);
      try {
        let card = null;
        if (/^\d+$/.test(key)) card = await getDirectoryUser(Number(key));
        else card = await lookupUserByNickname(key);
        if (!cancelled && card) setOfflineCard(normalizeCard(card));
      } catch {
        if (!cancelled) setOfflineCard(null);
      } finally {
        if (!cancelled) setResolving(false);
      }
    };

    const t = setTimeout(run, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [peerKey, selectedUser, normalizeCard]);

  const previewUser = selectedUser || offlineCard;

  // 자동완성: 디바운스 Suggest
  useEffect(() => {
    let cancelled = false;
    setSuggest([]);
    setSuggestOpen(false);

    const key = String(peerKey || '').trim();
    if (!key || /^\d+$/.test(key)) return; // 숫자는 suggest 생략(정책)
    const exactOnline = onlineUsers.find(u => (u.nickname || '').toLowerCase() === key.toLowerCase());
    if (exactOnline) return;

    const run = async () => {
      setSuggestLoading(true);
      setSuggestOpen(true);
      try {
        const list = await suggestUsers({ q: key, limit: 8 });
        if (!cancelled) { setSuggest(list || []); setSuggestOpen(true); }
      } catch {
        if (!cancelled) { setSuggest([]); setSuggestOpen(false); }
      } finally {
        if (!cancelled) setSuggestLoading(false);
      }
    };

    const t = setTimeout(run, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [peerKey, onlineUsers]);

  const pickSuggest = (u) => {
    setPeerKey(u.nickname || String(u.id)); // 입력 채우기
    setSuggestOpen(false);
    // 바로 시작하려면 아래 사용:
    startWithUserId(u.id, u, firstText || null);
  };

  // targetId로 바로 방 만들고 이동
  const startWithUserId = useCallback(
    async (targetId, cardHint = null, initialText = null) => {
      setErr('');
      setLoading(true);
      try {
        const conv = await getOrCreateConversation(targetId);
        const convId = conv?.convId ?? conv?.id;
        if (!convId) throw new Error('대화방 생성/조회에 실패했습니다.');

        const t = (initialText ?? '').trim();
        if (t) await sendTextByRest(convId, { text: t, msgId: uuid() });

        const card = cardHint || selectedUser || onlineUsers.find(u => u.id === targetId) || null;
        navigate(`/page/chat/${convId}`, {
          replace: true,
          state: {
            peerName: card?.nickname || card?.name,
            peerNickname: card?.nickname,
            peerProfileUrl: card?.imageUrl,
            peerOnline: card?.state === 'online',
          },
        });
      } catch (e2) {
        const status = e2?.response?.status;
        if (status === 400) setErr('본인과는 대화를 시작할 수 없습니다.');
        else if (status === 404) setErr('상대 사용자를 찾을 수 없습니다.');
        else setErr(e2?.response?.data?.message || e2?.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [navigate, onlineUsers, selectedUser]
  );

  // 폼 제출(입력값으로 시작)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    let targetId = null;
    let hintCard = null;

    try {
      const key = String(peerKey || '').trim();

      if (/^\d+$/.test(key)) {
        targetId = Number(key);
        try { hintCard = normalizeCard(await getDirectoryUser(targetId)); } catch {}
      } else {
        const user = await resolveByNickname(key);
        if (!user) throw new Error('해당 닉네임의 사용자를 찾지 못했어요. (온라인/오프라인 포함)');
        targetId = user.id;
        hintCard = user;
      }

      if (!targetId || targetId < 1) throw new Error('상대 사용자 식별값이 올바르지 않습니다.');
      await startWithUserId(targetId, hintCard || offlineCard, firstText);
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2?.message || '오류가 발생했습니다.');
    }
  };

  const handleQuickStart = async (u) => {
    if (loading) return;
    await startWithUserId(u.id, u, null);
  };

  const handlePick = (u) => setPeerKey(String(u.nickname || u.id));

  return (
    <section className="start-chat">
      <div className="start-chat__grid">
        {/* 왼쪽: 온라인 사용자 */}
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
                    disabled={loading}
                  >
                    바로 대화
                  </button>
                </li>
              ))}

              {!listLoading && onlineUsers.length === 0 && (
                <li className="user-empty">온라인 사용자가 없습니다.</li>
              )}

              <li ref={sentinelRef} style={{ height: 1 }} />
            </ul>

            {listLoading && (
              <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                불러오는 중…
              </div>
            )}
          </div>
        </aside>

        {/* 오른쪽: 새 대화 시작 */}
        <form onSubmit={handleSubmit} className="start-chat__card">
          <h5 className="start-chat__title">새 대화 시작</h5>

          <div className="form-row">
            <label className="form-label">상대 ID 또는 닉네임</label>

            <div className="typeahead-wrap">
              <input
                type="text"
                className="input"
                placeholder="예: 9 또는 nick123 (오프라인 포함)"
                value={peerKey}
                onChange={(e) => { setPeerKey(e.target.value); setSuggestOpen(true); }}
                disabled={loading}
                onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                onFocus={() => ( (suggest.length > 0) || suggestLoading ) && setSuggestOpen(true)}
              />

              {/* 단일 팝오버 컨테이너 */}
              {suggestOpen && (
                <div className="typeahead-pop" onMouseDown={(e) => e.preventDefault()}>
                  {suggestLoading ? (
                    <div className="typeahead__loading">검색중…</div>
                  ) : (suggest.length > 0) ? (
                    <ul className="typeahead-list" role="listbox">
                      {suggest.map(u => (
                        <li
                          key={u.id}
                          className="typeahead__item"
                          onClick={() => pickSuggest(u)}
                        >
                          <div className="typeahead__avatar">
                            {u.imageUrl
                              ? <img src={u.imageUrl} alt={u.nickname || u.name || `user-${u.id}`} />
                              : <div className="typeahead__fallback">{(u.nickname || u.name || 'U').slice(0,1)}</div>}
                            <span className={`dot ${u.state === 'online' ? 'dot--on' : 'dot--off'}`} />
                          </div>

                          <div className="typeahead__meta">
                            <div className="typeahead__name">
                              {u.nickname || u.name}
                              {u.state === 'offline' && <span className="badge-off">오프라인</span>}
                            </div>
                            <div className="typeahead__sub">#{u.id}{u.name ? ` · ${u.name}` : ''}</div>
                          </div>

                          <button
                            type="button"
                            className="btn btn--xs"
                            onClick={(e) => { e.stopPropagation(); startWithUserId(u.id, u, null); }}
                          >
                            시작
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="typeahead__empty">검색 결과가 없어요 (온라인/오프라인 포함)</div>
                  )}
                </div>
              )}
            </div>

            {/* 입력 도움말 */}
            <p className="form-hint">오프라인 사용자도 닉네임&ID로 검색돼요. 회색 점은 오프라인을 의미해요.</p>

            {previewUser && (
              <div className="start-chat__selected">
                선택됨: <b>{previewUser.nickname || previewUser.name}</b> (#{previewUser.id})
                {previewUser.state === 'offline' && ' · 오프라인'}
                {resolving && ' · 확인 중…'}
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
