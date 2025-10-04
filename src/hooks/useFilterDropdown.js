import { useState, useEffect } from 'react';

export const useDropdown = (closeOnOutsideClick = true) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => setIsOpen(!isOpen);
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    // 외부 클릭으로 드롭다운 닫기
    useEffect(() => {
        if (!closeOnOutsideClick) return;

        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-wrapper') &&
                !event.target.closest('.custom-dropdown')) {
                close();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [closeOnOutsideClick]);

    return {
        isOpen,
        toggle,
        open,
        close,
    };
};