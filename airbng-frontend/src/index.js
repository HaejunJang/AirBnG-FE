import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import "./styles/global.css";
import { AuthProvider } from './context/AuthContext';
import AdminApp from "./AdminApp";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <AuthProvider>
        <App />
        <AdminApp/>
    </AuthProvider>
);