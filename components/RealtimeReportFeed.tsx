// /components/RealtimeReportFeed.tsx
'use client';

import { useState, useEffect } from 'react';
import { getLatestReports } from '@/lib/api';
import { Report } from '@/types/report';

// API로부터 받은 텍스트(JSON) 형식의 Timestamp 타입 정의
interface SerializedTimestamp {
  seconds?: number;
  _seconds?: number;
}

const timeAgo = (timestamp: SerializedTimestamp): string => {
    const seconds = timestamp?.seconds ?? timestamp?._seconds;

    if (typeof seconds !== 'number') return '';
    
    const now = new Date();
    const secondsPast = (now.getTime() - (seconds * 1000)) / 1000;

    if (secondsPast < 60) return `${Math.round(secondsPast)}초 전`;
    if (secondsPast < 3600) return `${Math.round(secondsPast / 60)}분 전`;
    if (secondsPast <= 86400) return `${Math.round(secondsPast / 3600)}시간 전`;

    const day = new Date(seconds * 1000);
    return `${day.getFullYear()}.${String(day.getMonth() + 1).padStart(2, '0')}.${String(day.getDate()).padStart(2, '0')}`;
};


const RealtimeReportFeed = () => {
    const [latestReports, setLatestReports] = useState<Omit<Report, 'uid'>[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAndSetReports = async () => {
            try {
                const data = await getLatestReports();
                setLatestReports(data);
            } catch (error) {
                console.error("Failed to fetch latest reports for feed", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndSetReports();
        const interval = setInterval(fetchAndSetReports, 20000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3 text-slate-800">실시간 등록 현황</h3>
            {isLoading ? (
                <div className="text-center text-slate-500">불러오는 중...</div>
            ) : latestReports.length === 0 ? (
                <div className="text-center text-slate-500">아직 등록된 평가가 없습니다.</div>
            ) : (
                <ul className="space-y-3">
                    {latestReports.map(report => (
                        <li key={report.id} className="text-sm border-b border-slate-100 pb-2">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-700 truncate pr-2">{report.address}</span>
                                <span className="text-xs text-slate-500 flex-shrink-0">{timeAgo(report.createdAt as SerializedTimestamp)}</span>
                            </div>
                            <div className="text-slate-600 mt-1">
                                소음 점수: <span className="font-bold text-sky-600">{report.score}점</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RealtimeReportFeed;
