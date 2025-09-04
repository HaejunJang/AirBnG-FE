import { useState } from 'react';

const useDropdown = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [activeMoreMenu, setActiveMoreMenu] = useState(null);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const closeDropdown = () => {
        setDropdownOpen(false);
    };

    const toggleMoreMenu = (reservationId) => {
        setActiveMoreMenu(activeMoreMenu === reservationId ? null : reservationId);
    };

    const closeMoreMenu = () => {
        setActiveMoreMenu(null);
    };

    return {
        dropdownOpen,
        activeMoreMenu,
        toggleDropdown,
        closeDropdown,
        toggleMoreMenu,
        closeMoreMenu,
        setDropdownOpen
    };
};

export default useDropdown;