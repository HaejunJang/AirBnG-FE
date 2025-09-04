import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header/Header';
import ManageForm from '../components/locker/manage/ManageForm';
import useLockerManageForm from '../hooks/useLockerManageForm';
import { toggleLockerActivation, deleteLocker } from '../api/lockerApi';
import '../styles/pages/manage.css';

export default function LockerManagePage({ initial = null }) {
  const navigate = useNavigate();
  const { search } = useLocation();

  const qId = new URLSearchParams(search).get('lockerId');
  const lockerId = initial?.lockerId ?? qId;

  const {
    loading, detail, setDetail,
    files, setFiles,
    replaceMode, setReplaceMode,
    submit, reload
  } = useLockerManageForm(lockerId, { initial });

  const isActive = useMemo(() => detail?.isAvailable === 'YES', [detail]);
  const currentId = detail?.lockerId ?? lockerId;

  if (!lockerId) {
    return (
      <main className="airbng-manage">
        <Header headerTitle="보관소 수정" showBackButton backUrl="/page/lockers" />
        잘못된 접근입니다.{' '}
        <button className="btn btn--outline" onClick={() => navigate('/page/lockers')}>돌아가기</button>
      </main>
    );
  }

  if (loading) return <main className="airbng-manage">불러오는 중…</main>;
  if (!detail)  return <main className="airbng-manage">데이터가 없습니다.</main>;

  return (
    <main className="airbng-manage">
      <div className="manage-container">
        <Header headerTitle="보관소 수정" showBackButton backUrl="/page/lockers" />

        <ManageForm
          detail={detail} setDetail={setDetail}
          files={files} setFiles={setFiles}
          replaceMode={replaceMode} setReplaceMode={setReplaceMode}
          onSubmit={async () => {
            await submit();
            alert('보관소 정보가 수정되었습니다.');
            navigate('/page/lockers');
          }}
        />

        <div className="locker-action-buttons">
          <button
            className={`toggle-btn ${isActive ? 'btn-stop' : 'btn-restart'}`}
            onClick={async () => {
              const msg = isActive ? '정말 중지하겠습니까?' : '보관소를 재개하시겠습니까?';
              if (window.confirm(msg)) {
                await toggleLockerActivation(currentId);
                await reload();
              }
            }}>
            {isActive ? '보관소 중지' : '보관소 재개'}
          </button>

          <button
            className="delete-locker-btn"
            onClick={async () => {
              if (window.confirm('정말 삭제하시겠습니까? 삭제된 정보는 복구할 수 없습니다.')) {
                await deleteLocker(currentId);
                navigate('/page/lockers');
              }
            }}>
            보관소 삭제
          </button>
        </div>
      </div>
    </main>
  );
}
