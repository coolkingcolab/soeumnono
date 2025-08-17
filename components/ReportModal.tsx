// /components/ReportModal.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { auth } from '@/lib/firebase'; // Firebase 초기화 파일에서 auth 객체 가져오기
import { onAuthStateChanged, User } from 'firebase/auth';
import { noiseOptions } from '@/constants/noiseOptions';
import { checkEligibility, submitReport } from '@/lib/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

const ReportModal = ({ isOpen, onClose, address }: ReportModalProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [score, setScore] = useState<number>(3);
  const [selectedNoiseTypes, setSelectedNoiseTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isEligible, setIsEligible] = useState(false);

  // 사용자 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 모달이 열릴 때마다 평가 자격 확인
  useEffect(() => {
    if (isOpen && currentUser) {
      setErrorMessage(''); // 이전 에러 메시지 초기화
      const verifyEligibility = async () => {
        try {
          const data = await checkEligibility();
          if (data.eligible) {
            setIsEligible(true);
          } else {
            setIsEligible(false);
            setErrorMessage('이미 1년 이내에 평가를 제출하셨습니다. 내년에 다시 시도해주세요.');
          }
        } catch (error) {
          setIsEligible(false);
          setErrorMessage('평가 자격을 확인하는 중 오류가 발생했습니다.');
        }
      };
      verifyEligibility();
    }
  }, [isOpen, currentUser]);

  const handleNoiseTypeChange = (type: string) => {
    setSelectedNoiseTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMessage('로그인이 필요합니다.');
      return;
    }
    if (!isEligible) {
        setErrorMessage('평가를 제출할 수 없습니다.');
        return;
    }
    if (selectedNoiseTypes.length === 0) {
      setErrorMessage('소음 종류를 하나 이상 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await submitReport({ address, score, noiseTypes: selectedNoiseTypes });
      alert('평가가 성공적으로 등록되었습니다.');
      onClose(); // 성공 시 모달 닫기
      // 상태 초기화
      setScore(3);
      setSelectedNoiseTypes([]);
    } catch (error: any) {
      setErrorMessage(error.message || '평가 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold mb-2">소음 평가하기</h2>
        <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded-md mb-4 break-words">{address}</p>

        {!currentUser ? (
          <div className="text-center p-6 bg-yellow-50 rounded-lg">
            <p className="font-semibold text-yellow-800">로그인 후 평가를 남길 수 있습니다.</p>
            <p className="text-sm text-yellow-700 mt-1">소중한 데이터는 익명으로 안전하게 관리됩니다.</p>
          </div>
        ) : !isEligible ? (
             <div className="text-center p-6 bg-red-50 rounded-lg">
                <p className="font-semibold text-red-800">{errorMessage}</p>
             </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* 점수 선택 */}
            <div className="mb-4">
              <label className="block text-md font-medium text-gray-700 mb-2">소음 점수 (5점이 가장 심각)</label>
              <div className="flex items-center justify-between">
                <span>1점</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full mx-4"
                />
                <span>5점</span>
                <span className="font-bold text-blue-600 ml-4 text-lg w-8 text-center">{score}</span>
              </div>
            </div>

            {/* 소음 종류 선택 */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-2">주요 소음 종류 (중복 선택 가능)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {noiseOptions.map((option) => (
                  <label key={option.id} className={`flex items-center p-2 border rounded-md cursor-pointer transition-colors ${selectedNoiseTypes.includes(option.label) ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}>
                    <input
                      type="checkbox"
                      checked={selectedNoiseTypes.includes(option.label)}
                      onChange={() => handleNoiseTypeChange(option.label)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-800">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {errorMessage && <p className="text-red-500 text-sm mb-4 text-center">{errorMessage}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? '제출 중...' : '평가 제출하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
