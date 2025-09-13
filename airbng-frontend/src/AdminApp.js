import {Routes, Route, BrowserRouter} from "react-router-dom";
import AdminHomePage from "./pages/admin/AdminHomePage";
import "./styles/admin/Adminglobal.module.css";
import AdminDashboard from "./pages/admin/AdminFistPage";

function AdminApp() {
    return (
        <div className="admin-container">
            <BrowserRouter>
                <Routes>
                    <Route path="/admin" element={<AdminDashboard/>}/>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default AdminApp;
