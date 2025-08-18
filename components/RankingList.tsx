// /components/RankingList.tsx
'use client';

import { useState, useEffect } from 'react';
import { getRanking } from '@/lib/api';

interface RankedLocation {
  address: string;
  averageScore: number;
  reportCount: number;
}

const RankingList = () => {
    const [ranking, setRanking] = useState<RankedLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRanking = async () => {
            setIsLoading(true);
            try {
                const data = await getRanking();
                setRanking(data);
            } catch (error) {
                console.error("Failed to fetch ranking data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRanking();
    }, []);

    const getMedal = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `${index + 1}.`;
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3 text-slate-800">🏆 가장 조용한 장소 TOP 5</h3>
            <p className="text-xs text-slate-500 mb-4">(평가 3건 이상인 장소 기준)</p>
            {isLoading ? (
                <div className="text-center text-slate-500">랭킹을 불러오는 중...</div>
            ) : ranking.length === 0 ? (
                <div className="text-center text-slate-500">아직 랭킹 데이터가 부족합니다.</div>
            ) : (
                <ol className="space-y-3">
                    {ranking.map((item, index) => (
                        <li key={item.address} className="flex items-center justify-between p-2 rounded-md transition-colors hover:bg-slate-50">
                            <div className="flex items-center min-w-0">
                                <span className="text-lg font-bold w-10 flex-shrink-0">{getMedal(index)}</span>
                                <div className="truncate">
                                    <p className="font-semibold text-slate-700 text-sm truncate" title={item.address}>{item.address}</p>
                                    <p className="text-xs text-slate-500">총 {item.reportCount}건의 평가</p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 pl-4">
                                <p className="font-bold text-sky-600 text-lg">{item.averageScore.toFixed(1)}<span className="text-sm font-normal text-slate-500"> 점</span></p>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
};

export default RankingList;
