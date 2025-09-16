import React from 'react';
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminRoute from "./components/admin/AdminRoute";
import styles from "./styles/admin/AdminRoute.module.css";
import "./styles/admin/Adminglobal.module.css";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import SalesOverviewPage from "./components/admin/SalesOverviewPage";
import StorageReviewPage from "./pages/admin/StorageReviewPage";
import PeriodSalesPage from "./pages/admin/PeriodSalesPage";
import StorageSalesPage from "./pages/admin/StorageSalesPage";
import PaymentSalesPage from "./pages/admin/PaymentSalesPage";
import NetSalesPage from "./pages/admin/NetSalesPage";

function AdminApp() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/admin/login" element={<AdminLoginPage/>}/>
                <Route path="/admin/home" element={
                    <AdminDashboardPage/>
                }/>

                <Route path="/admin/storage-review" element={
                    <AdminRoute>
                        <StorageReviewPage/>
                    </AdminRoute>
                }/>

                <Route path="/admin/sales" element={
                    <AdminRoute>
                        <SalesOverviewPage />
                    </AdminRoute>
                } />

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