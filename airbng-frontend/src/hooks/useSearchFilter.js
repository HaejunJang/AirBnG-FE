import { useState } from 'react';
import {useNavigate} from "react-router-dom";

export const useSearchFilter = (jimTypeId = '모든 짐') => {
    const navigate = useNavigate();
    // 검색 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedBagType, setSelectedBagType] = useState(jimTypeId);
    const [selectedStartTime, setSelectedStartTime] = useState('18:00');
    const [selectedEndTime, setSelectedEndTime] = useState('20:00');

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
        // // TODO: 실제 API 호출로 교체
        // const mockResults = [
        //     { id: 1, name: '강남역 짐보관소', jimTypeName: selectedBagType, address: '서울시 강남구 강남대로 123' },
        //     { id: 2, name: '홍대입구 보관함', jimTypeName: selectedBagType, address: '서울시 마포구 홍익로 456' }
        // ];
        //
        // setSearchResults(mockResults);
        // setShowResults(true);
        const jimTypeId = jimTypeMap.indexOf(selectedBagType);

        const params = new URLSearchParams({
            address: searchQuery,
            lockerName : searchQuery,
            // date: selectedDate,
            jimTypeId: jimTypeId.toString()
            // startTime: selectedStartTime,
            // endTime: selectedEndTime
        }).toString();
        navigate(`/lockerSearchDetails?${params}`);
    };

    // 순위 아이템 클릭
    const handleRankingClick = (location) => {
        setSearchQuery(location);
        handleSearch();
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
        selectedStartTime,
        selectedEndTime,
        showDateModal,
        showTimeModal,
        searchResults,
        showResults,

        // 상태 업데이터
        setSearchQuery,
        setSelectedDate,
        setSelectedBagType,
        setSelectedStartTime,
        setSelectedEndTime,

        // 액션 핸들러
        handleSearch,
        handleRankingClick,
        openDateModal,
        closeDateModal,
        openTimeModal,
        closeTimeModal,
    };
};