import React from 'react';
import '../../../styles/pages/searchFilter.css';

const SearchRanking = ({ onRankingClick }) => {
    const rankingLocations = [
        { rank: 1, location: '강남' },
        { rank: 2, location: '홍대' },
        { rank: 3, location: '이태원' },
        { rank: 4, location: '성수' }
    ];

    return (
        <div className="search-ranking">
            <h3 className="ranking-title">검색 순위</h3>
            <div className="ranking-list">
                {rankingLocations.map((item) => (
                    <div
                        key={item.rank}
                        className="ranking-item"
                        onClick={() => onRankingClick(item.location)}
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
                ))}
            </div>
        </div>
    );
};

export default SearchRanking;