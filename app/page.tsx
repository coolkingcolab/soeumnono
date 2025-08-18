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
import CoupangBanner from '@/components/CoupangBanner'; // 새로 만든 쿠팡 배너 컴포넌트 임포트

export default function Home() {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAddress, setModalAddress] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddressSelect = (address: string) => {
    setSelectedAddress(address);
  };

  const handleMapClick = (address: string) => {
    setModalAddress(address);
    setIsModalOpen(true);
  };

  const handleReportSuccess = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="w-full h-full space-y-6">
      <div className="p-4 bg-white rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-3 text-slate-800">주소로 층간소음 정보 검색</h1>
        <AddressSearch onAddressSelect={handleAddressSelect} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[50vh] lg:h-[60vh] bg-white rounded-lg shadow-lg overflow-hidden relative">
          <MapViewer
            selectedAddress={selectedAddress}
            onMapClick={handleMapClick}
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
                <ReportList address={selectedAddress} refreshKey={refreshKey} />
              </>
            )}
            {!selectedAddress && (
              <p className="text-slate-500 text-sm">
                지도에서 건물을 클릭하거나 주소를 검색하여<br/>
                층간소음 정보를 확인하세요.
              </p>
            )}
          </div>
          
          <RealtimeReportFeed />

          {/* 새로 만든 쿠팡 배너 컴포넌트를 여기에 추가 */}
          <CoupangBanner />

          <div className="p-4 bg-white rounded-lg shadow flex items-center justify-center h-full">
             <AdsenseBanner />
          </div>
        </div>
      </div>

      <div className="w-full">
        <RankingList />
      </div>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        address={modalAddress}
        onSuccess={handleReportSuccess}
      />
    </div>
  );
}
