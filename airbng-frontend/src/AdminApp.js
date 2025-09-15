import React from 'react';
import AdminDashboard from './pages/admin/AdminFistPage';
import {Routes, Route, BrowserRouter} from "react-router-dom";
import "./styles/admin/Adminglobal.module.css";

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
        <div className="admin-container">
            <BrowserRouter>
                <Routes>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/storage-review" element={<StorageReviewPage />} />
                    <Route path="/admin/sales/period" element={<PeriodSalesPage />} />
                    <Route path="/admin/sales/storage" element={<StorageSalesPage />} />
                    <Route path="/admin/sales/payment" element={<PaymentSalesPage />} />
                    <Route path="/admin/sales/net" element={<NetSalesPage />} />
                </Routes>
            </BrowserRouter>
        </div>

    );
}

export default AdminApp;
