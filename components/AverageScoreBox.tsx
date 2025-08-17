// /components/AverageScoreBox.tsx
'use client';

import { useState, useEffect } from 'react';
import { getReports } from '@/lib/api';

interface AverageScoreBoxProps {
  address: string;
}

const AverageScoreBox = ({ address }: AverageScoreBoxProps) => {
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
  }, [address]);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-200';
    if (score < 2) return 'bg-blue-500';
    if (score < 3) return 'bg-green-500';
    if (score < 4) return 'bg-yellow-400';
    if (score < 4.5) return 'bg-orange-500';
    return 'bg-red-600';
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
    <div className={`p-4 rounded-lg mb-4 text-white shadow ${getScoreColor(averageScore)}`}>
      <h3 className="text-md font-semibold opacity-90">평균 소음 점수 (총 {reportCount}건)</h3>
      {averageScore !== null ? (
        <p className="text-4xl font-bold mt-1">{averageScore.toFixed(1)}<span className="text-2xl font-normal opacity-80"> / 5</span></p>
      ) : (
        <p className="text-lg font-medium mt-2 text-gray-800">데이터 없음</p>
      )}
    </div>
  );
};

export default AverageScoreBox;
