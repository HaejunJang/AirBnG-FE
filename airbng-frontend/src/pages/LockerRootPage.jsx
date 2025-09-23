import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header/Header";
import LockerWelcome from "../components/locker/LockerWelcome";
import { useModal, Modal } from "../components/common/ModalUtil";
import LockerSummaryCard from "../components/locker/LockerSummaryCard";
import EmptyLockerCTA from "../components/locker/EmptyLockerCTA";
import {
    hasMyLocker,
    getMyLocker,
    getLockerViewStatus,
    toggleLockerActivation,
    deleteLocker,
} from "../api/lockerApi";
import "../styles/pages/locker.css";
import "../styles/pages/manage.css";
import "../styles/common/modalUtil.css"

const unbox = (res) => res?.data?.result ?? res?.data?.data ?? res?.data;

export default function LockerRootPage() {
    const { ready, isLoggedIn } = useAuth() || {};
    const [loading, setLoading] = useState(true);
    const [hasLocker, setHasLocker] = useState(false);
    const [locker, setLocker] = useState(null);
    const [lockerStatus, setLockerStatus] = useState("REGISTER");
    const [canRegister, setCanRegister] = useState(false);
    const { modalState, hideModal, showWarning, modal } = useModal();
    const navigate = useNavigate();

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const existRes = await hasMyLocker();
            const exists = !!unbox(existRes);
            setHasLocker(exists);

            if (exists) {
                const meRes = await getMyLocker();
                setLocker(unbox(meRes));
            } else {
                setLocker(null);

                // 등록 가능 여부 확인
                try {
                    const statusRes = await getLockerViewStatus();
                    const status = unbox(statusRes);
                    // REJECTED도 등록 가능
                    setCanRegister(
                        status?.reviewStatus === "REGISTER" || status?.reviewStatus === "REJECTED"
                    );
                } catch (err) {
                    console.error("Locker status fetch failed", err);
                    setCanRegister(false);
                }
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!ready) return;
        if (!isLoggedIn) {
            setHasLocker(false);
            setLocker(null);
            setCanRegister(false);
            setLoading(false);
            return;
        }
        load();
    }, [ready, isLoggedIn, load]);

  const handleManage = useCallback(() => {
    if (!locker?.lockerId) return;
    navigate(`/page/lockers/manage?lockerId=${locker.lockerId}`);
  }, [navigate, locker]);

  const handleDetail = useCallback(() => {
    if (!locker?.lockerId) return;
    navigate(`/page/lockers/${locker.lockerId}`);
  }, [navigate, locker]);

  const handleToggle = useCallback(async () => {
    if (!locker?.lockerId) return;
    modal.showConfirm(
      locker.isAvailable === "YES" ? "중지 확인" : "재개 확인",
      locker.isAvailable === "YES"
        ? "정말 중지하겠습니까?"
        : "보관소를 재개하시겠습니까?",
      async () => {
        await toggleLockerActivation(locker.lockerId);
        await load();
        modal.showSuccess(
          locker.isAvailable === "YES" ? "중지 완료" : "재개 완료",
          locker.isAvailable === "YES"
            ? "보관소가 중지되었습니다."
            : "보관소가 재개되었습니다."
        );
      }
    );
  }, [locker, load, modal]);

  const handleDelete = useCallback(async () => {
    if (!locker?.lockerId) return;
    modal.showConfirm(
      "삭제 확인",
      "정말 삭제하시겠습니까? 삭제된 정보는 복구할 수 없습니다.",
      async () => {
        await deleteLocker(locker.lockerId);
        await load();
        modal.showSuccess(
          "삭제 완료",
          "보관소가 삭제되었습니다."
        );
      }
    );
  }, [locker, load, modal]);

  if (!ready) return null;
  if (!isLoggedIn) return <LockerWelcome />;
  if (loading) return <div className="manage-container">불러오는 중…</div>;

    return (
        <div className="airbng-locker">
            <div className="container">
                <Header headerTitle="보관소" showBackButton={false} />
                <main className="main-content">
                    {hasLocker ? (
                        <LockerSummaryCard
                            locker={locker}
                            onManage={handleManage}
                            onDetail={handleDetail}
                            onToggle={handleToggle}
                            onDelete={handleDelete} // 현재 없음 - 나중에 추가
                        />
                    ) : (
                        <EmptyLockerCTA
                            onRegister={() => {
                                if (!canRegister) {
                                    showWarning("등록불가", "심사 중인 보관소가 있습니다.\n심사를 기다려주세요.");
                                    return;
                                }
                                navigate("/page/lockers/register");
                            }}
                            disabled={!canRegister}
                        />

                    )}
                </main>
            </div>

            {/* 알림 모달 */}
            <Modal
                show={modalState.show}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                showCancel={modalState.showCancel}
                onConfirm={modalState.onConfirm}
                onCancel={modalState.onCancel}
                onClose={hideModal}
            />
        </div>
    );
}
