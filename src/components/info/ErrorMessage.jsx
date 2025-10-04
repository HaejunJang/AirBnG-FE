import React from 'react';
import info from '../../styles/pages/myInfo.module.css';

const ErrorMessage = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className={info.errorMessage}>
            {message}
            {onClose && (
                <button
                    onClick={onClose}
                    style={{
                        float: 'right',
                        background: 'none',
                        border: 'none',
                        color: '#c33',
                        fontSize: '16px',
                        cursor: 'pointer',
                        padding: '0 0 0 10px'
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;