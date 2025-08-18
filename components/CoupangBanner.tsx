// /components/CoupangBanner.tsx
'use client';

import Script from 'next/script';

// TypeScript가 PartnersCoupang 객체를 인식하도록 window 타입 확장
declare global {
    interface Window {
        PartnersCoupang?: any;
    }
}

const CoupangBanner = () => {
  return (
    <div className="p-4 bg-white rounded-lg shadow flex items-center justify-center overflow-x-auto">
      {/* Next.js의 Script 컴포넌트를 사용하여 쿠팡 파트너스 스크립트를 로드합니다.
        strategy="lazyOnload"는 다른 콘텐츠 로딩이 끝난 후에 스크립트를 불러와 초기 로딩 속도를 향상시킵니다.
      */}
      <Script
        src="https://ads-partners.coupang.com/g.js"
        strategy="lazyOnload"
      />
      <Script
        id="coupang-partners-init"
        strategy="lazyOnload"
      >
        {/* 위 스크립트 로드가 완료된 후, 이 초기화 스크립트가 실행되어 배너를 렌더링합니다.
        */}
        {`new PartnersCoupang.G({"id":906192,"trackingCode":"AF2173805","subId":null,"template":"carousel","width":"680","height":"140"});`}
      </Script>
    </div>
  );
};

export default CoupangBanner;
