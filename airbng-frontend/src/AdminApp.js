import React from 'react';
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminRoute from "./components/admin/AdminRoute";
import styles from "./styles/admin/AdminRoute.module.css";
import "./styles/admin/Adminglobal.module.css";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";

// 임시 페이지 컴포넌트들 (실제 페이지가 만들어질 때까지 사용)
const StorageReviewPage = () => (
    <div style={{ padding: '20px' }}>
        <h1>보관소 심사 페이지</h1>
        <p>보관소 승인 및 심사 관리 페이지입니다.</p>
    </div>
);

const PeriodSalesPage = () => (
    <div style={{ padding: '20px' }}>
        <h1>기간별 매출 페이지</h1>
        <p>기간별 매출 현황을 확인할 수 있습니다.</p>
    </div>
);

const StorageSalesPage = () => (
    <div style={{ padding: '20px' }}>
        <h1>보관소별 매출 페이지</h1>
        <p>각 보관소의 매출을 비교할 수 있습니다.</p>
    </div>
);

const PaymentSalesPage = () => (
    <div style={{ padding: '20px' }}>
        <h1>결제 수단별 매출 페이지</h1>
        <p>결제 수단별 매출 현황을 분석할 수 있습니다.</p>
    </div>
);

const NetSalesPage = () => (
    <div style={{ padding: '20px' }}>
        <h1>순매출 페이지</h1>
        <p>순매출 및 수익률을 분석할 수 있습니다.</p>
    </div>
);

function AdminApp() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 로그인 페이지는 레이아웃 제외 */}
                <Route path="/admin/login" element={<AdminLoginPage/>}/>

                {/* 모든 관리자 페이지는 자동으로 레이아웃 적용 */}
                <Route path="/admin/home" element={
                    <AdminDashboardPage/>
                }/>

                <Route path="/admin/storage-review" element={
                    <AdminRoute>
                        <StorageReviewPage/>
                    </AdminRoute>
                }/>

                <Route path="/admin/sales/period" element={
                    <AdminRoute>
                        <PeriodSalesPage/>
                    </AdminRoute>
                }/>

                <Route path="/admin/sales/storage" element={
                    <AdminRoute>
                        <StorageSalesPage/>
                    </AdminRoute>
                }/>

                <Route path="/admin/sales/payment" element={
                    <AdminRoute>
                        <PaymentSalesPage/>
                    </AdminRoute>
                }/>

                <Route path="/admin/sales/net" element={
                    <AdminRoute>
                        <NetSalesPage/>
                    </AdminRoute>
                }/>

                <Route path="/admin" element={<Navigate to="/admin/home" replace/>}/>

                <Route path="/admin/*" element={
                    <AdminRoute>
                        <div className={styles.notFound}>
                            <h2>페이지를 찾을 수 없습니다</h2>
                            <button
                                className={styles.authButton}
                                onClick={() => window.location.href = '/admin/home'}
                            >
                                관리자 홈으로
                            </button>
                        </div>
                    </AdminRoute>
                }/>
            </Routes>
        </BrowserRouter>
    );
}

export default AdminApp;