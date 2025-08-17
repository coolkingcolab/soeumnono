// /components/AdsenseBanner.tsx
'use client';

import { useEffect } from 'react';

// adsbygoogle의 정확한 타입 정의
declare global {
  interface Window {
    adsbygoogle?: object[]; // ✅ 여기를 수정!
  }
}

const AdsenseBanner = () => {
  const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const ADSENSE_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_AD_SLOT;

  useEffect(() => {
    try {
      // adsbygoogle 배열 초기화 및 광고 요청
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('Adsense error:', err);
    }
  }, []);

  if (process.env.NODE_ENV !== 'production' || !ADSENSE_CLIENT_ID || !ADSENSE_AD_SLOT) {
    return (
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md">
        <span className="text-gray-500">광고 표시 영역</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={ADSENSE_AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdsenseBanner;
