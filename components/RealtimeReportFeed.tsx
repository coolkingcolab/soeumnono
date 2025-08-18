// /components/RealtimeReportFeed.tsx
'use client';

import { useState, useEffect } from 'react';
import { getLatestReports } from '@/lib/api';
import { Report } from '@/types/report';
import { Timestamp } from 'firebase/firestore';

// Firestore Timestamp를 "방금 전", "5분 전" 등으로 변환하는 함수
const timeAgo = (timestamp: Timestamp): string => {
    if (!timestamp) return '';
    const now = new Date();
    const secondsPast = (now.getTime() - timestamp.toDate().getTime()) / 1000;

    if (secondsPast < 60) return `${Math.round(secondsPast)}초 전`;
    if (secondsPast < 3600) return `${Math.round(secondsPast / 60)}분 전`;
    if (secondsPast <= 86400) return `${Math.round(secondsPast / 3600)}시간 전`;

    const day = timestamp.toDate();
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

        fetchAndSetReports(); // 처음 한 번 즉시 실행
        const interval = setInterval(fetchAndSetReports, 20000); // 20초마다 데이터 새로고침

        return () => clearInterval(interval); // 컴포넌트가 사라질 때 인터벌 정리
    }, []);

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">실시간 등록 현황</h3>
            {isLoading ? (
                <div className="text-center text-gray-500">불러오는 중...</div>
            ) : latestReports.length === 0 ? (
                <div className="text-center text-gray-500">아직 등록된 평가가 없습니다.</div>
            ) : (
                <ul className="space-y-3">
                    {latestReports.map(report => (
                        <li key={report.id} className="text-sm border-b border-gray-100 pb-2">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700 truncate pr-2">{report.address}</span>
                                <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo(report.createdAt as Timestamp)}</span>
                            </div>
                            <div className="text-gray-600 mt-1">
                                소음 점수: <span className="font-bold text-blue-600">{report.score}점</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RealtimeReportFeed;
