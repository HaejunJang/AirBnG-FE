// AdminApp.js (수정된 버전)
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminHomePage from "./pages/admin/AdminHomePage";
import AdminRoute from "./components/admin/AdminRoute";
import styles from "./styles/admin/AdminRoute.module.css";

function AdminApp() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/admin/login" element={<AdminLoginPage/>}/>

                <Route
                    path="/admin/home"
                    element={
                        <AdminRoute>
                            <AdminHomePage/>
                        </AdminRoute>
                    }
                />

                <Route path="/admin" element={<Navigate to="/admin/home" replace />}/>

                <Route path="/admin/*" element={
                    <div className={styles.notFound}>
                        <h2>페이지를 찾을 수 없습니다</h2>
                        <button
                            className={styles.authButton}
                            onClick={() => window.location.href = '/admin/home'}
                        >
                            관리자 홈으로
                        </button>
                    </div>
                }/>
            </Routes>
        </BrowserRouter>
    );
}

export default AdminApp;