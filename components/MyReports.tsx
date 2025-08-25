// /components/MyReports.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getMyReports } from '@/lib/api';
import { Report } from '@/types/report';

interface MyReportsProps {
  refreshKey: number;
  onEditClick: (report: Report) => void;
}

interface SerializedTimestamp {
  _seconds: number;
}

const MyReports = ({ refreshKey, onEditClick }: MyReportsProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      getMyReports()
        .then(data => setMyReports(data))
        .catch(err => console.error("Failed to fetch my reports", err))
        .finally(() => setIsLoading(false));
    }
  }, [currentUser, refreshKey]);

  const calculateDaysLeft = () => {
    if (myReports.length < 5) return null;
    const lastReport = myReports[0];
    const lastReportDate = new Date((lastReport.createdAt as unknown as SerializedTimestamp)._seconds * 1000);
    const nextAvailableDate = new Date(lastReportDate.getTime() + 180 * 24 * 60 * 60 * 1000);
    const timeLeft = nextAvailableDate.getTime() - new Date().getTime();
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3 text-black">나의 평가 기록</h3>
      {isLoading ? (
        <p className="text-sm text-slate-700">기록을 불러오는 중...</p>
      ) : (
        <>
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md mb-4 text-sm text-slate-800">
            <p>총 <span className="font-bold">{myReports.length}</span>건의 평가를 남겼습니다.</p>
            {myReports.length >= 5 && (
              <p className="text-right">
                다음 평가까지 <span className="font-bold text-blue-600">{calculateDaysLeft()}일</span> 남음
              </p>
            )}
          </div>
          {myReports.length > 0 ? (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {myReports.map(report => (
                <li key={report.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{report.address}</p>
                    <p className="text-xs text-slate-600">점수: {report.score}점</p>
                  </div>
                  <button 
                    onClick={() => onEditClick(report)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    수정
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-center text-slate-700 py-4">아직 남긴 평가가 없습니다.</p>
          )}
        </>
      )}
    </div>
  );
};

export default MyReports;
