import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header/Header';
import ManageForm from '../components/locker/manage/ManageForm';
import useLockerManageForm from '../hooks/useLockerManageForm';
import { toggleLockerActivation, deleteLocker } from '../api/lockerApi';
import '../styles/pages/manage.css';
import { Modal, useModal } from '../components/common/ModalUtil';

export default function LockerManagePage({ initial = null }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const modal = useModal();

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
            modal.showSuccess(
              "수정 완료",
              "보관소 정보가 수정되었습니다.",
              () => navigate('/page/lockers')
            );
          }}
        />

        <div className="locker-action-buttons">
          <button
            className={`toggle-btn ${isActive ? 'btn-stop' : 'btn-restart'}`}
            onClick={() => {
              modal.showConfirm(
                isActive ? '중지 확인' : '재개 확인',
                isActive ? '정말 중지하겠습니까?' : '보관소를 재개하시겠습니까?',
                async () => {
                  await toggleLockerActivation(currentId);
                  await reload();
                  modal.showSuccess(
                    isActive ? '중지 완료' : '재개 완료',
                    isActive ? '보관소가 중지되었습니다.' : '보관소가 재개되었습니다.'
                  );
                }
              );
            }}>
            {isActive ? '보관소 중지' : '보관소 재개'}
          </button>

          <button
            className="delete-locker-btn"
            onClick={() => {
              modal.showConfirm(
                '삭제 확인',
                '정말 삭제하시겠습니까? 삭제된 정보는 복구할 수 없습니다.',
                async () => {
                  await deleteLocker(currentId);
                  modal.showSuccess(
                    '삭제 완료',
                    '보관소가 삭제되었습니다.',
                    () => navigate('/page/lockers')
                  );
                }
              );
            }}>
            보관소 삭제
          </button>
        </div>
      </div>
      {/* 모달 컴포넌트 추가 */}
      <Modal {...modal.modalState} onClose={modal.hideModal} />
    </main>
  );
}
