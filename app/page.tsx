// /app/page.tsx
'use client';

import { useState } from 'react';

// 컴포넌트 임포트 (실제 파일 생성 후 경로 확인 필요)
import MapViewer from '@/components/MapViewer';
import AddressSearch from '@/components/AddressSearch';
import ReportList from '@/components/ReportList';
import AverageScoreBox from '@/components/AverageScoreBox';
import NoiseScoreLegend from '@/components/NoiseScoreLegend';
import HeatmapToggle from '@/components/HeatmapToggle';
import AdsenseBanner from '@/components/AdsenseBanner';
import ReportModal from '@/components/ReportModal';

export default function Home() {
  // 선택된 주소 상태 관리
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  // 평가 모달 표시 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 모달에 전달할 주소 정보
  const [modalAddress, setModalAddress] = useState<string>('');

  // 주소 선택 시 호출될 핸들러
  const handleAddressSelect = (address: string) => {
    console.log('Selected Address:', address);
    setSelectedAddress(address);
  };

  // 지도 클릭 시 평가 모달을 여는 핸들러
  const handleMapClick = (address: string) => {
    setModalAddress(address);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full h-full">
      {/* --- 상단 컨트롤 영역 --- */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-3">주소로 층간소음 정보 검색</h1>
        <AddressSearch onAddressSelect={handleAddressSelect} />
      </div>

      {/* --- 메인 콘텐츠 영역 (지도 + 정보) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- 왼쪽: 지도 및 관련 컨트롤 --- */}
        <div className="lg:col-span-2 h-[60vh] lg:h-[75vh] bg-white rounded-lg shadow-lg overflow-hidden relative">
          <MapViewer
            selectedAddress={selectedAddress}
            onMapClick={handleMapClick} // 지도 클릭 시 모달 열기
          />
          <div className="absolute top-4 right-4 z-10 bg-white p-2 rounded-md shadow-md">
            <HeatmapToggle />
          </div>
          <div className="absolute bottom-4 left-4 z-10">
            <NoiseScoreLegend />
          </div>
        </div>

        {/* --- 오른쪽: 평가 정보 및 광고 --- */}
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">
              {selectedAddress ? `"${selectedAddress}" 소음 정보` : '주소를 선택해주세요'}
            </h2>
            {selectedAddress && (
              <>
                <AverageScoreBox address={selectedAddress} />
                <ReportList address={selectedAddress} />
              </>
            )}
            {!selectedAddress && (
              <p className="text-gray-500 text-sm">
                지도에서 건물을 클릭하거나 주소를 검색하여<br/>
                층간소음 정보를 확인하세요.
              </p>
            )}
          </div>
          
          {/* 광고 배너 */}
          <div className="p-4 bg-white rounded-lg shadow flex items-center justify-center h-full">
             <AdsenseBanner />
          </div>
        </div>
      </div>

      {/* 평가 모달 */}
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        address={modalAddress}
      />
    </div>
  );
}
