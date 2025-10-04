import { useState } from 'react';
import { useNavigate } from "react-router-dom";

export const useSearchFilter = (jimTypeId = '모든 짐') => {
    const navigate = useNavigate();
    // 검색 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedBagType, setSelectedBagType] = useState(jimTypeId);

    // 모달 상태
    const [showDateModal, setShowDateModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);

    // 검색 결과 상태
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const jimTypeMap = [
        '모든 짐',
        '백팩/가방',
        '캐리어 소형',
        '캐리어 대형',
        '박스/큰 짐',
        '유아용품'
    ];

    // 검색 실행
    const handleSearch = () => {
        const jimTypeId = jimTypeMap.indexOf(selectedBagType);

        const params = new URLSearchParams({
            address: searchQuery,
            jimTypeId: jimTypeId.toString()
        }).toString();

        navigate(`/page/lockerSearchDetails?${params}`);
    };

    // 순위 아이템 클릭 - 필요한 값만 파라미터로 전달
    const handleRankingClick = ({ address, jimTypeId }) => {
        console.log('받은 데이터:', { address, jimTypeId }); // 확인용

        const params = new URLSearchParams({
            address: address || '',
            jimTypeId: jimTypeId?.toString() || '0'
        }).toString();

        console.log('생성된 URL 파라미터:', params);
        navigate(`/page/lockerSearchDetails?${params}`);
    };


    // 모달 관리
    const openDateModal = () => setShowDateModal(true);
    const closeDateModal = () => setShowDateModal(false);
    const openTimeModal = () => setShowTimeModal(true);
    const closeTimeModal = () => setShowTimeModal(false);

    return {
        // 상태
        searchQuery,
        selectedDate,
        selectedBagType,
        showDateModal,
        showTimeModal,
        searchResults,
        showResults,

        // 상태 업데이터
        setSearchQuery,
        setSelectedDate,
        setSelectedBagType,

        // 액션 핸들러
        handleSearch,
        handleRankingClick,
        openDateModal,
        closeDateModal,
        openTimeModal,
        closeTimeModal,
    };
};