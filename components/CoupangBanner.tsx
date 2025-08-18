// /components/CoupangBanner.tsx
'use client';

import Script from 'next/script';

// TypeScript가 PartnersCoupang 객체를 정확히 인식하도록 타입 확장
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
  return (
    <div className="p-4 bg-white rounded-lg shadow flex items-center justify-center overflow-x-auto">
      {/* onLoad prop을 사용하여 스크립트 로딩이 완료된 직후에
        배너 초기화 코드가 실행되도록 보장합니다.
        이것이 더 안정적인 방법입니다.
      */}
      <Script
        src="https://ads-partners.coupang.com/g.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (window.PartnersCoupang) {
            new window.PartnersCoupang.G({"id":906192,"trackingCode":"AF2173805","subId":null,"template":"carousel","width":"680","height":"140"});
          }
        }}
      />
    </div>
  );
};

export default CoupangBanner;
