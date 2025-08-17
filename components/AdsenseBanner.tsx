// /components/AdsenseBanner.tsx
'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    // any 대신 unknown[] 타입 사용
    adsbygoogle: unknown[];
  }
}

const AdsenseBanner = () => {
  const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const ADSENSE_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_AD_SLOT;

  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        // 타입 단언을 통해 push가 존재한다고 가정
        (window.adsbygoogle as { push: (obj: object) => void }[]).push({});
      }
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
