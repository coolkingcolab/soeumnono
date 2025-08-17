// /components/AdsenseBanner.tsx
'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any;
  }
}

const AdsenseBanner = () => {
  const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const ADSENSE_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_AD_SLOT;

  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (err) {
      console.error('Adsense error:', err);
    }
  }, []);

  // 실제 운영 환경이 아닐 경우, 광고 대신 플레이스홀더를 보여줍니다.
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
