// /components/ReportList.tsx
'use client';

import { useState, useEffect } from 'react';
import { getReports } from '@/lib/api';
import { Report } from '@/types/report';
import { Timestamp } from 'firebase/firestore';

interface ReportListProps {
  address: string;
}

const formatDate = (timestamp: Timestamp): string => {
  if (!timestamp || !timestamp.seconds) {
    return '날짜 정보 없음';
  }
  const date = timestamp.toDate();
  return date.toISOString().split('T')[0];
};

const ReportList = ({ address }: ReportListProps) => {
  const [reports, setReports] = useState<Omit<Report, 'uid'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getReports(address);
        data.sort((a, b) => (b.createdAt as Timestamp).seconds - (a.createdAt as Timestamp).seconds);
        setReports(data);
      } catch (err) {
        setError('평가 목록을 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [address]);

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3 animate-pulse">
        <div className="h-16 bg-gray-200 rounded-md"></div>
        <div className="h-16 bg-gray-200 rounded-md"></div>
        <div className="h-16 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  if (error) {
    return <p className="mt-4 text-center text-red-500">{error}</p>;
  }

  if (reports.length === 0) {
    return <p className="mt-4 text-center text-gray-500">아직 등록된 평가가 없습니다.</p>;
  }

  return (
    <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2">
      {reports.map((report) => (
        <div key={report.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">
                소음 점수: <span className="text-blue-600 font-bold">{report.score}점</span>
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {report.noiseTypes.map((type) => (
                  <span key={type} className="px-2 py-0.5 text-xs text-gray-700 bg-gray-200 rounded-full">
                    {type}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatDate(report.createdAt as Timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportList;
