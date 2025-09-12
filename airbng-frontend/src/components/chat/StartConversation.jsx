import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOrCreateConversation, sendTextByRest } from '../../api/chatApi';
import { v4 as uuid } from 'uuid';

export default function StartConversation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [peerId, setPeerId] = useState('');
  const [firstText, setFirstText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const p = params.get('peerId');
    const t = params.get('firstText');
    if (p) setPeerId(p);
    if (t) setFirstText(t);
  }, [params]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    const idNum = Number(peerId);
    if (!idNum || idNum < 1) {
      setErr('상대 사용자 ID를 올바르게 입력하세요.');
      return;
    }

    setLoading(true);
    try {
      const conv = await getOrCreateConversation(idNum);
      const convId = conv?.convId || conv?.id;
      if (!convId) throw new Error('대화방 생성/조회에 실패했습니다.');

      const t = firstText.trim();
      if (t) await sendTextByRest(convId, { text: t, msgId: uuid() });

      navigate(`/page/chat/${convId}`, { replace: true });
    } catch (e2) {
      const status = e2?.response?.status;
      if (status === 400) setErr('본인과는 대화를 시작할 수 없습니다.');
      else if (status === 404) setErr('상대 사용자를 찾을 수 없습니다.');
      else setErr(e2?.response?.data?.message || e2?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="start-chat">
      <form onSubmit={handleSubmit} className="start-chat__card">
        <h5 className="start-chat__title">새 대화 시작</h5>

        <div className="form-row">
          <label className="form-label">상대 사용자 ID</label>
          <input
            type="number"
            className="input"
            placeholder="예: 9"
            value={peerId}
            onChange={(e) => setPeerId(e.target.value)}
            required
            min={1}
            disabled={loading}
          />
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
    </section>
  );
}
