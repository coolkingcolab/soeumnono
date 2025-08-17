// /app/report/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReportModal from '@/components/ReportModal';

// Suspense로 감싸서 useSearchParams를 안전하게 사용하기 위한 컴포넌트
function ReportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const address = searchParams.get('address');

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 주소 파라미터가 있을 경우에만 모달을 엽니다.
    if (address) {
      setIsModalOpen(true);
    } else {
      // 주소 정보가 없으면 홈페이지로 리디렉션하거나 안내 메시지를 표시할 수 있습니다.
      // 여기서는 홈페이지로 돌려보냅니다.
      alert('평가할 주소 정보가 없습니다. 홈페이지로 이동합니다.');
      router.push('/');
    }
  }, [address, router]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // 모달을 닫으면 홈페이지로 이동합니다.
    router.push('/');
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50">
      <ReportModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        address={address || ''}
      />
    </div>
  );
}


export default function ReportPage() {
  return (
    // 클라이언트 컴포넌트에서 useSearchParams를 사용하려면 Suspense로 감싸야 합니다.
    <Suspense fallback={<div>Loading...</div>}>
      <ReportPageContent />
    </Suspense>
  );
}
