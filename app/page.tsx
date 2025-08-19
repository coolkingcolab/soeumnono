// /app/page.tsx
'use client';

import { useState } from 'react';
import MapViewer from '@/components/MapViewer';
import AddressSearch from '@/components/AddressSearch';
import ReportList from '@/components/ReportList';
import AverageScoreBox from '@/components/AverageScoreBox';
import AdsenseBanner from '@/components/AdsenseBanner';
import ReportModal from '@/components/ReportModal';
import RealtimeReportFeed from '@/components/RealtimeReportFeed';
import RankingList from '@/components/RankingList';
import CoupangBanner from '@/components/CoupangBanner';
import MyReports from '@/components/MyReports'; // 나의 평가 기록 컴포넌트 임포트
import { Report } from '@/types/report';

export default function Home() {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAddress, setModalAddress] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [reportToEdit, setReportToEdit] = useState<Report | null>(null); // 수정할 평가 데이터 상태

  const handleAddressSelect = (address: string) => {
    setSelectedAddress(address);
  };

  const handleReportSuccess = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleOpenModalForSelectedAddress = () => {
    if (selectedAddress) {
      setReportToEdit(null); // 새로 만들기 모드로 설정
      setModalAddress(selectedAddress);
      setIsModalOpen(true);
    }
  };

  // 수정 버튼 클릭 시 실행될 함수
  const handleEditClick = (report: Report) => {
    setReportToEdit(report); // 수정 모드로 설정
    setModalAddress(report.address); // 주소는 수정하지 않으므로 기존 주소 사용
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setReportToEdit(null); // 모달이 닫힐 때 수정 상태 초기화
  };

  return (
    <div className="w-full h-full space-y-6">
      <div className="p-4 bg-white rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-3 text-slate-800">주소로 층간소음 정보 검색</h1>
        <AddressSearch onAddressSelect={handleAddressSelect} />
      </div>

      <div className="w-full">
        <RankingList />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[50vh] lg:h-[60vh] bg-white rounded-lg shadow-lg overflow-hidden relative">
          <MapViewer
            selectedAddress={selectedAddress}
            // onMapClick prop 제거
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2 text-slate-800">
              {selectedAddress ? `"${selectedAddress}" 소음 정보` : '주소를 선택해주세요'}
            </h2>
            {selectedAddress && (
              <>
                <AverageScoreBox address={selectedAddress} refreshKey={refreshKey} />
                <ReportList
                  address={selectedAddress}
                  refreshKey={refreshKey}
                  onRateClick={handleOpenModalForSelectedAddress}
                />
              </>
            )}
            {!selectedAddress && (
              <div className="text-slate-500 text-sm space-y-3">
                <p>
                  지도에서 건물을 클릭하거나 주소를 검색하여<br/>
                  층간소음 정보를 확인하세요.
                </p>
                <p className="text-xs pt-3 border-t border-slate-200">
                  * 최초 로그인 시 최대 5곳까지 평가할 수 있습니다.<br/>
                  * 5곳을 모두 평가한 후에는 마지막 평가일로부터 6개월(180일)마다 1곳씩 추가 평가가 가능합니다.
                </p>
              </div>
            )}
          </div>
          
          <RealtimeReportFeed />

          {/* 나의 평가 기록 컴포넌트를 쿠팡 배너 위에 추가 */}
          <MyReports refreshKey={refreshKey} onEditClick={handleEditClick} />

          <CoupangBanner />
          <AdsenseBanner />
        </div>
      </div>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        address={modalAddress}
        onSuccess={handleReportSuccess}
        reportToEdit={reportToEdit} // 수정할 데이터 전달
      />
    </div>
  );
}
