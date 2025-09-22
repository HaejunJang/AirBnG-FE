import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header/Header";
import LockerWelcome from "../components/locker/LockerWelcome";
import LockerSummaryCard from "../components/locker/LockerSummaryCard";
import EmptyLockerCTA from "../components/locker/EmptyLockerCTA";
import {
  hasMyLocker,
  getMyLocker,
  toggleLockerActivation,
  deleteLocker,
} from "../api/lockerApi";
import { Modal, useModal } from "../components/common/ModalUtil";
import "../styles/pages/locker.css";
import "../styles/pages/manage.css";

const unbox = (res) => res?.data?.result ?? res?.data?.data ?? res?.data;

export default function LockerRootPage() {
  const { ready, isLoggedIn } = useAuth() || {};
  const [loading, setLoading] = useState(true);
  const [hasLocker, setHasLocker] = useState(false);
  const [locker, setLocker] = useState(null);
  const navigate = useNavigate();
  const modal = useModal();

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
              onDelete={handleDelete}
            />
          ) : (
            <EmptyLockerCTA onRegister={() => navigate("/page/lockers/register")} />
          )}
        </main>
      </div>
      <Modal {...modal.modalState} onClose={modal.hideModal} />
    </div>
  );
}
