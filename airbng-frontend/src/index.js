import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import AdminApp from "./AdminApp";

const root = ReactDOM.createRoot(document.getElementById('root'));

// URL 기반으로 판단
const isAdmin = window.location.pathname.startsWith('/admin');

// 조건부로 CSS import
if (isAdmin) {
    import('./styles/admin/Adminglobal.module.css');
} else {
    import('./styles/global.css');
}

root.render(
    <AuthProvider>
        {isAdmin ? <AdminApp/> : <App/>}
    </AuthProvider>
);