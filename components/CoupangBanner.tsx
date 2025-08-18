// /components/CoupangBanner.tsx
'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    PartnersCoupang?: {
      G: new (options: {
        id: number;
        trackingCode: string;
        subId: string | null;
        template: string;
        width: string;
        height: string;
      }) => void;
    };
  }
}

const CoupangBanner = () => {
  useEffect(() => {
    if (window.PartnersCoupang) {
      // 쿠팡 스크립트 로드 완료 후 실행
      new window.PartnersCoupang.G({
        id: 906192,
        trackingCode: "AF2173805",
        subId: null,
        template: "carousel",
        width: "680",
        height: "140"
      });
    }
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow flex items-center justify-center overflow-x-auto">
      {/* 실제 배너가 붙을 컨테이너 */}
      <div id="coupang-banner-container"></div>

      {/* g.js 스크립트 불러오기 */}
      <Script
        src="https://ads-partners.coupang.com/g.js"
        strategy="afterInteractive"
      />
    </div>
  );
};

export default CoupangBanner;
