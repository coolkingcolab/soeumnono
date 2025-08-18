// /app/report/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReportModal from '@/components/ReportModal';

function ReportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const address = searchParams.get('address');

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (address) {
      setIsModalOpen(true);
    } else {
      alert('평가할 주소 정보가 없습니다. 홈페이지로 이동합니다.');
      router.push('/');
    }
  }, [address, router]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    router.push('/');
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50">
      <ReportModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        address={address || ''}
        // onSuccess 속성 추가 (이 페이지에서는 특별한 동작이 필요 없으므로 빈 함수 전달)
        onSuccess={() => {}}
      />
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportPageContent />
    </Suspense>
  );
}
