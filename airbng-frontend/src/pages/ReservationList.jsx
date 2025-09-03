// ReservationList.jsx
import React, {useContext} from 'react';
import { useNavigate } from 'react-router-dom';

import AuthContext from '../api/reservationApi'; // 로그인 회원 정보 context
import useReservationList from '../hooks/useReservationList';
import useModal from '../hooks/useModal';
import useDropdown from '../hooks/useDropdown';
import ReservationHeader from '../components/Header/reservation/ReservationHeader';
import ReservationTabs from '../components/reservation/ReservationTabs';
import ReservationCard from '../components/reservation/ReservationCard';
import Modals from '../components/reservation/Modals';
import EmptyAndLoading from '../components/reservation/EmptyAndLoading';

import { PERIOD_OPTIONS } from '../utils/reservation/reservationUtils';

import "../styles/pages/reservation/reservationList.css"
import "../styles/layout/header.css"

const ReservationList = () => {
    const navigate = useNavigate();
    // const { member } = useContext(AuthContext);
    // const memberId = member?.memberId;
    const memberId = 1;


    const {
        currentStates,
        currentPeriod,
        currentIsDropper,
        loading,
        reservations,
        showEmpty,
        backendMessage,
        changeTab,
        changeToggle,
        selectPeriod,
        deleteReservation
    } = useReservationList(memberId); //memberId 넣기

    const {
        confirmModal,
        successModal,
        errorModal,
        showConfirmModal,
        hideConfirmModal,
        showSuccessModal,
        hideSuccessModal,
        showErrorModal,
        hideErrorModal
    } = useModal();

    const {
        dropdownOpen,
        activeMoreMenu,
        toggleDropdown,
        closeDropdown,
        toggleMoreMenu,
        setDropdownOpen
    } = useDropdown();

    if (!1) return <div>로그인 후 확인 가능합니다.</div>;

    // 예약 삭제 처리
    const handleDeleteReservation = async (reservationId) => {
        const result = await deleteReservation(reservationId);
        if (result.success) {
            showSuccessModal(result.refundAmount);
        } else {
            showErrorModal();
        }
    };

    // Filter 표시 여부
    const shouldShowFilter = ['COMPLETED', 'CANCELLED'].some(s => currentStates.includes(s));


    //필터링
    const filteredReservations = reservations.filter(reservation => {
        // 1) role 필터링
        const roleMatches = currentIsDropper ? reservation.role === 'DROPPER' : reservation.role === 'KEEPER';

        // 2) state 필터링 (탭)
        const stateMatches = currentStates.includes(reservation.state);

        // 3) period 필터링
        let periodMatches = true;
        if (currentPeriod !== 'ALL') {
            const now = new Date();
            const periodStart = new Date();
            switch (currentPeriod) {
                case '1W':
                    periodStart.setDate(now.getDate() - 7);
                    break;
                case '1M':
                    periodStart.setMonth(now.getMonth() - 1);
                    break;
                case '3M':
                    periodStart.setMonth(now.getMonth() - 3);
                    break;
                case '6M':
                    periodStart.setMonth(now.getMonth() - 6);
                    break;
                case '1Y':
                    periodStart.setFullYear(now.getFullYear() - 1);
                    break;
                default:
                    periodStart.setFullYear(1970);
            }
            const resDate = new Date(reservation.dateOnly);
            // const resDate = new Date(String(reservation.dateOnly));
            periodMatches = resDate >= periodStart && resDate <= now;
        }

        return roleMatches && stateMatches && periodMatches;
    });


    return (
        <div className="page-container">
            {/* 헤더 */}
            <ReservationHeader />

            {/* 탭 메뉴 */}
            <ReservationTabs
                currentStates={currentStates}
                changeTab={changeTab}
                loading={loading}
            />

            {/* 토글 + 필터 섹션 */}
            <div className="controls-container">
                {/* Toggle */}
                <div className="toggle-section">
                    <div className="toggle-container">
                        <div
                            className={`toggle-option ${currentIsDropper ? 'active' : ''}`}
                            onClick={() => !loading && changeToggle(true)}
                        >
                            맡긴 내역
                        </div>
                        <div
                            className={`toggle-option ${!currentIsDropper ? 'active' : ''}`}
                            onClick={() => !loading && changeToggle(false)}
                        >
                            맡아준 내역
                        </div>
                    </div>

                    {/* Filter */}
                    {shouldShowFilter && (
                        <div className="filter-section">
                            <div className="period-dropdown">
                                <button
                                    className={`dropdown-btn ${dropdownOpen ? 'open' : ''}`}
                                    onClick={toggleDropdown}
                                    disabled={loading}
                                >
                                    <span>{PERIOD_OPTIONS.find(p => p.value === currentPeriod)?.label || '전체'}</span>
                                    <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6,9 12,15 18,9"></polyline>
                                    </svg>
                                </button>
                                {dropdownOpen && (
                                    <div className="dropdown-menu show">
                                        {PERIOD_OPTIONS.map(option => (
                                            <div
                                                key={option.value}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    selectPeriod(option.value);
                                                    closeDropdown();
                                                }}
                                            >
                                                {option.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>


            </div>

            {/* 예약 내역 리스트 */}
            {filteredReservations.length > 0 && (
                <div className="reservation-list">
                    {filteredReservations.map(reservation => (
                        <ReservationCard
                            key={reservation.reservationId}
                            reservation={reservation}
                            currentIsDropper={currentIsDropper}
                            activeMoreMenu={activeMoreMenu}
                            toggleMoreMenu={toggleMoreMenu}
                            onShowConfirmModal={showConfirmModal}
                            navigate={navigate}
                        />
                    ))}
                </div>
            )}



            {/* 빈 상태 & 로딩 */}
            <EmptyAndLoading
                data={filteredReservations}  // 필터링된 실제 예약 데이터를 전달
                loading={loading}
                message={showEmpty ? backendMessage : ""}
            />
            {/* 모달들 */}
            <Modals
                confirmModal={confirmModal}
                successModal={successModal}
                errorModal={errorModal}
                hideConfirmModal={hideConfirmModal}
                hideSuccessModal={hideSuccessModal}
                hideErrorModal={hideErrorModal}
                onDeleteConfirm={handleDeleteReservation}
            />
        </div>
    );
};

export default ReservationList;
