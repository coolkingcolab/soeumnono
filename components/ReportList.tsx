// /components/ReportList.tsx
'use client';

import { useState, useEffect } from 'react';
import { getReports } from '@/lib/api';
import { Report } from '@/types/report';

interface ReportListProps {
  address: string;
  refreshKey: number;
  onRateClick: () => void;
}

interface SerializedTimestamp {
  seconds?: number;
  _seconds?: number;
}

const formatDate = (timestamp: SerializedTimestamp): string => {
  const seconds = timestamp?.seconds ?? timestamp?._seconds;

  if (typeof seconds !== 'number') {
    return '날짜 정보 없음';
  }
  const date = new Date(seconds * 1000);
  return date.toISOString().split('T')[0];
};

const ReportList = ({ address, refreshKey, onRateClick }: ReportListProps) => {
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
        data.sort((a, b) => {
            const secondsA = (a.createdAt as SerializedTimestamp)?.seconds ?? (a.createdAt as SerializedTimestamp)?._seconds ?? 0;
            const secondsB = (b.createdAt as SerializedTimestamp)?.seconds ?? (b.createdAt as SerializedTimestamp)?._seconds ?? 0;
            return secondsB - secondsA;
        });
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
      </div>
    );
  }

  if (error) {
    return <p className="mt-4 text-center text-red-500">{error}</p>;
  }

  return (
    <div className="mt-4">
      {reports.length === 0 ? (
        <p className="text-center text-slate-500 text-sm mb-4">아직 등록된 평가가 없습니다.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 mb-4">
          {reports.map((report) => (
            <div key={report.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-800">
                    소음 점수: <span className="font-bold text-sky-600">{report.score}점</span>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {report.noiseTypes.map((type) => (
                      <span key={type} className="px-2 py-0.5 text-xs text-slate-600 bg-slate-200 rounded-full">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{formatDate(report.createdAt as SerializedTimestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 버튼을 조건문 밖으로 빼서 항상 보이도록 하고, 문구 수정 */}
      <div className="text-center mt-4">
        <button
          onClick={onRateClick}
          className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          이 장소 평가하기
        </button>
      </div>
    </div>
  );
};

export default ReportList;
