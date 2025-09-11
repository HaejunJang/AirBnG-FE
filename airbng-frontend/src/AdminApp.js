import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AdminFistPage from "./pages/admin/AdminFistPage";


function AdminApp() {


    function MainContent() {
        const location = useLocation();
        const active = getActiveNav(location.pathname);

        return (
            <div className="airbng-home">
                <Routes>
                    <Route path="/admin" element={<AdminFistPage />} />
                </Routes>

            </div>
        );
    }

    return (
        <BrowserRouter>
                <MainContent />
        </BrowserRouter>
    );
}

export default AdminApp;
