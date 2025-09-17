// 보관소 더미 데이터
export const storageData = {
    pending: [
        { id: 1, name: '강남 보관소', owner: '김철수', location: '서울 강남구', date: '2024-01-15' },
        { id: 2, name: '홍대 보관소', owner: '박영희', location: '서울 마포구', date: '2024-01-16' },
        { id: 3, name: '명동 보관소', owner: '이민수', location: '서울 중구', date: '2024-01-17' },
        { id: 4, name: '강서 보관소', owner: '최지현', location: '서울 강서구', date: '2024-01-18' },
        { id: 5, name: '송파 보관소', owner: '정다윤', location: '서울 송파구', date: '2024-01-19' },
        { id: 6, name: '노원 보관소', owner: '한민기', location: '서울 노원구', date: '2024-01-20' },
        { id: 7, name: '서초 보관소', owner: '임수진', location: '서울 서초구', date: '2024-01-21' },
        { id: 8, name: '관악 보관소', owner: '조현우', location: '서울 관악구', date: '2024-01-22' },
        { id: 9, name: '동작 보관소', owner: '윤서연', location: '서울 동작구', date: '2024-01-23' },
        { id: 10, name: '영등포 보관소', owner: '신태호', location: '서울 영등포구', date: '2024-01-24' },
        { id: 11, name: '용산 보관소', owner: '오지은', location: '서울 용산구', date: '2024-01-25' },
        { id: 12, name: '성북 보관소', owner: '장민혁', location: '서울 성북구', date: '2024-01-26' }
    ],
    approved: [
        { id: 13, name: '잠실 보관소', owner: '김영수', location: '서울 송파구', date: '2024-01-10' },
        { id: 14, name: '종로 보관소', owner: '이하늘', location: '서울 종로구', date: '2024-01-11' },
        { id: 15, name: '광화문 보관소', owner: '박세진', location: '서울 중구', date: '2024-01-12' },
        { id: 16, name: '압구정 보관소', owner: '최민석', location: '서울 강남구', date: '2024-01-13' },
        { id: 17, name: '여의도 보관소', owner: '정수빈', location: '서울 영등포구', date: '2024-01-14' }
    ],
    rejected: [
        {
            id: 18,
            name: '불량 보관소',
            owner: '문제인',
            location: '서울 강남구',
            date: '2024-01-05',
            rejectReason: '제출된 보관소 이미지가 불분명하고, 보안 시설이 부족하여 안전성 기준을 충족하지 못합니다.'
        },
        {
            id: 19,
            name: '미흡 보관소',
            owner: '부족한',
            location: '서울 마포구',
            date: '2024-01-06',
            rejectReason: '접근성이 떨어지는 위치에 있고, 운영 시간이 고객 편의를 고려하지 않아 부적절합니다.'
        },
        {
            id: 20,
            name: '불합격 보관소',
            owner: '안됨이',
            location: '서울 중구',
            date: '2024-01-07',
            rejectReason: '허위 정보가 포함되어 있으며, 실제 보관소 위치와 등록 정보가 일치하지 않습니다.'
        }
    ]
};

// 보관소 상세 정보를 가져오는 함수
export const getStorageDetail = (storage) => ({
    ...storage,
    lockerName: storage.name,
    address: storage.location,
    addressDetail: '상세 주소 정보',
    keeperName: storage.owner,
    keeperPhone: '010-1234-5678',
    images: [
        'https://via.placeholder.com/400x300/4561DB/FFFFFF?text=보관소+이미지1',
        'https://via.placeholder.com/400x300/28a745/FFFFFF?text=보관소+이미지2',
        'https://via.placeholder.com/400x300/fd7e14/FFFFFF?text=보관소+이미지3'
    ],
    jimTypeResults: [
        { typeName: '소형 가방', pricePerHour: 1000 },
        { typeName: '중형 캐리어', pricePerHour: 2000 },
        { typeName: '대형 캐리어', pricePerHour: 3000 }
    ],
    isAvailable: 'YES',
    // 반려 사유가 있는 경우 포함
    rejectReason: storage.rejectReason || null
});

