// /components/AverageScoreBox.tsx
'use client';

import { useState, useEffect } from 'react';
import { getReports } from '@/lib/api';

interface AverageScoreBoxProps {
  address: string;
  refreshKey: number;
}

const AverageScoreBox = ({ address, refreshKey }: AverageScoreBoxProps) => {
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [reportCount, setReportCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    const fetchAndCalculateAverage = async () => {
      setIsLoading(true);
      try {
        const reports = await getReports(address);
        if (reports.length > 0) {
          const totalScore = reports.reduce((sum, report) => sum + report.score, 0);
          setAverageScore(totalScore / reports.length);
          setReportCount(reports.length);
        } else {
          setAverageScore(null);
          setReportCount(0);
        }
      } catch (error) {
        console.error('Failed to fetch average score:', error);
        setAverageScore(null);
        setReportCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndCalculateAverage();
  }, [address, refreshKey]);

  // 가독성 좋은 색상으로 변경
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-slate-200 text-slate-800'; // 데이터 없을 때
    if (score < 2) return 'bg-sky-500 text-white'; // 조용함
    if (score < 3) return 'bg-emerald-500 text-white'; // 약간의 소음
    if (score < 4) return 'bg-amber-500 text-white'; // 보통
    if (score < 4.5) return 'bg-orange-500 text-white'; // 시끄러움
    return 'bg-red-600 text-white'; // 매우 심각
  };

  if (isLoading) {
    return (
        <div className="p-4 rounded-lg bg-gray-200 animate-pulse">
            <div className="h-6 w-3/4 bg-gray-300 rounded mb-2"></div>
            <div className="h-10 w-1/2 bg-gray-300 rounded"></div>
        </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg mb-4 shadow-md transition-colors duration-300 ${getScoreColor(averageScore)}`}>
      <h3 className="text-md font-semibold opacity-90">평균 소음 점수 (총 {reportCount}건)</h3>
      {averageScore !== null ? (
        <p className="text-4xl font-bold mt-1">{averageScore.toFixed(1)}<span className="text-2xl font-normal opacity-80"> / 5</span></p>
      ) : (
        <p className="text-lg font-medium mt-2">데이터 없음</p>
      )}
    </div>
  );
};

export default AverageScoreBox;
