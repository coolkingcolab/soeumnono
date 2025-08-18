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
      <Script
        src="https://ads-partners.coupang.com/g.js"
        strategy="lazyOnload"
      />
      <Script
        id="coupang-partners-init"
        strategy="lazyOnload"
      >
        {`
          if (window.PartnersCoupang) {
            new window.PartnersCoupang.G({"id":906192,"trackingCode":"AF2173805","subId":null,"template":"carousel","width":"680","height":"140"});
          }
        `}
      </Script>
    </div>
  );
};

export default CoupangBanner;
