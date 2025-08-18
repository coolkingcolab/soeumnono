// /components/ReportList.tsx
'use client';

import { useState, useEffect } from 'react';
import { getReports } from '@/lib/api';
import { Report } from '@/types/report';

interface ReportListProps {
  address: string;
  refreshKey: number;
}

// API로부터 받은 텍스트(JSON) 형식의 Timestamp 타입 정의
interface SerializedTimestamp {
  seconds: number;
  nanoseconds: number;
}

const formatDate = (timestamp: SerializedTimestamp): string => {
  if (!timestamp || typeof timestamp.seconds !== 'number') {
    return '날짜 정보 없음';
  }
  // .toDate() 대신 new Date()를 사용하여 초 단위 시간으로 날짜 객체 생성
  const date = new Date(timestamp.seconds * 1000);
  return date.toISOString().split('T')[0];
};

const ReportList = ({ address, refreshKey }: ReportListProps) => {
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
        // createdAt 타입이 다르므로 정렬 방식 수정
        data.sort((a, b) => 
            (b.createdAt as unknown as SerializedTimestamp).seconds - 
            (a.createdAt as unknown as SerializedTimestamp).seconds
        );
        setReports(data);
      } catch (err) {
        setError('평가 목록을 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [address, refreshKey]);

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
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatDate(report.createdAt as unknown as SerializedTimestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportList;
