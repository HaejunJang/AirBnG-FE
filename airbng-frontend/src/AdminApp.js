import {Routes, Route, BrowserRouter} from "react-router-dom";
import AdminHomePage from "./pages/admin/AdminHomePage";
import "./styles/admin/Adminglobal.module.css";

function AdminApp() {
    return (
        <div className="admin-container">
            <BrowserRouter>
                <Routes>
                    <Route path="/admin" element={<AdminHomePage/>}/>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default AdminApp;
