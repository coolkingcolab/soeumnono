// /app/page.tsx
'use client';

import { useState } from 'react';
import MapViewer from '@/components/MapViewer';
import AddressSearch from '@/components/AddressSearch';
import ReportList from '@/components/ReportList';
import AverageScoreBox from '@/components/AverageScoreBox';
import NoiseScoreLegend from '@/components/NoiseScoreLegend';
import HeatmapToggle from '@/components/HeatmapToggle';
import AdsenseBanner from '@/components/AdsenseBanner';
import ReportModal from '@/components/ReportModal';
import RealtimeReportFeed from '@/components/RealtimeReportFeed'; // 새로 만든 컴포넌트 임포트

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
    <div className="w-full h-full">
      <div className="mb-4 p-4 bg-white rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-3">주소로 층간소음 정보 검색</h1>
        <AddressSearch onAddressSelect={handleAddressSelect} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[60vh] lg:h-[75vh] bg-white rounded-lg shadow-lg overflow-hidden relative">
          <MapViewer
            selectedAddress={selectedAddress}
            onMapClick={handleMapClick}
          />
          <div className="absolute top-4 right-4 z-10 bg-white p-2 rounded-md shadow-md">
            <HeatmapToggle />
          </div>
          <div className="absolute bottom-4 left-4 z-10">
            <NoiseScoreLegend />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">
              {selectedAddress ? `"${selectedAddress}" 소음 정보` : '주소를 선택해주세요'}
            </h2>
            {selectedAddress && (
              <>
                <AverageScoreBox address={selectedAddress} refreshKey={refreshKey} />
                <ReportList address={selectedAddress} refreshKey={refreshKey} />
              </>
            )}
            {!selectedAddress && (
              <p className="text-gray-500 text-sm">
                지도에서 건물을 클릭하거나 주소를 검색하여<br/>
                층간소음 정보를 확인하세요.
              </p>
            )}
          </div>
          
          {/* 실시간 피드 컴포넌트 추가 */}
          <RealtimeReportFeed />

          <div className="p-4 bg-white rounded-lg shadow flex items-center justify-center h-full">
             <AdsenseBanner />
          </div>
        </div>
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
