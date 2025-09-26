import React, { useEffect, useState } from 'react';
import { getPopularTop5 } from '../../../api/lockerApi';
import '../../../styles/pages/searchFilter.css';

const SearchRanking = ({ onRankingClick }) => {
    const [popularLocations, setPopularLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    // 인기 보관 지역 데이터 가져오기
    useEffect(() => {
        const loadPopularLocations = async () => {
            try {
                const { data } = await getPopularTop5();
                if (data?.code === 1000 && data?.result?.lockers) {
                    // API 데이터를 SearchRanking 형태로 변환
                    const rankingData = data.result.lockers.slice(0, 4).map((locker, index) => ({
                        rank: index + 1,
                        location: locker.lockerName, // 또는 locker.address의 일부를 사용
                        address: locker.address,
                        jimTypeId : locker.jimTypeResults[0]?.jimTypeId || 0,
                        lockerId: locker.lockerId // 클릭 시 사용할 수 있는 추가 정보
                    }));
                    setPopularLocations(rankingData);
                } else {
                    // API 실패 시 기본값 사용
                    setPopularLocations([
                        { rank: 1, location: '강남' },
                        { rank: 2, location: '홍대' },
                        { rank: 3, location: '이태원' },
                        { rank: 4, location: '성수' }
                    ]);
                }
            } catch (error) {
                console.error('인기 보관 지역 로드 실패:', error);
                // 에러 시 기본값 사용
                setPopularLocations([
                    { rank: 1, location: '강남' },
                    { rank: 2, location: '홍대' },
                    { rank: 3, location: '이태원' },
                    { rank: 4, location: '성수' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        loadPopularLocations();
    }, []);

    // 로딩 중일 때 표시할 컴포넌트
    if (loading) {
        return (
            <div className="search-ranking">
                <h3 className="ranking-title">인기 보관소</h3>
                <div className="ranking-loading">불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="search-ranking">
            <h3 className="ranking-title">인기 보관소</h3>
            <div className="ranking-list">
                {popularLocations.length === 0 ? (
                    <div className="no-ranking">표시할 인기 보관소가 없습니다</div>
                ) : (
                    popularLocations.map((item) => (
                        <div
                            key={item.rank}
                            className="ranking-item"
                            onClick={() => onRankingClick({
                                address: item.address,
                                jimTypeId: item.jimTypeId
                            })}
                        >
                            <div className="ranking-content">
                                <div className="ranking-number-container">
                                    <div className="cube-face front">{item.rank}</div>
                                    <div className="cube-face back">{item.rank}</div>
                                    <div className="cube-face top">{item.rank}</div>
                                    <div className="cube-face bottom">{item.rank}</div>
                                </div>
                                <div className="ranking-location-container">
                                    <div className="cube-face front">{item.location}</div>
                                    <div className="cube-face back">{item.location}</div>
                                    <div className="cube-face top">{item.location}</div>
                                    <div className="cube-face bottom">{item.location}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SearchRanking;