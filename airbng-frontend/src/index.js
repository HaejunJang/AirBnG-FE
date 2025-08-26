import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import "./styles/global.css"; // 전역 한 번만

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);