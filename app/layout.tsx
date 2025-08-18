// /app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import Link from 'next/link';
import './globals.css';
import MetaTags from '@/components/MetaTags';
import AuthButton from '@/components/AuthButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '소음노노 - 우리 동네 층간소음 확인하기',
  description: '지도 기반으로 우리 동네, 우리 아파트의 층간소음 정보를 확인하고 직접 평가를 남겨보세요. 소음노노는 실제 거주자들의 소음 데이터를 제공합니다.',
  keywords: ['층간소음', '소음', '아파트 소음', '소음 지도', '소음 평가', 'soeumnono'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;
  const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="ko">
      <head>
        <MetaTags
          title="소음노노 - 우리 동네 층간소음 확인하기"
          description="지도 기반으로 우리 동네, 우리 아파트의 층간소음 정보를 확인하고 직접 평가를 남겨보세요."
          url="https://www.soeumnono.com" // 실제 서비스 도메인으로 변경
          imageUrl="https://www.soeumnono.com/og-image.png" // OG 이미지 경로
        />

        {/* Google Analytics 스크립트 */}
        {GA_TRACKING_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            />
            <Script
              id="gtag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}

        {/* ========================================================== */}
        {/* 요청하신 소유권 확인용 Google AdSense 스크립트가 여기 있습니다. */}
        {/* ========================================================== */}
        {ADSENSE_CLIENT_ID && (
          <Script
            id="adsense-init"
            strategy="afterInteractive"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-800`}>
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 bg-white shadow-md">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex-shrink-0">
                  <Link href="/" className="text-2xl font-bold text-blue-600">
                    소음노노
                  </Link>
                </div>
                <div className="flex items-center">
                  <AuthButton />
                </div>
              </div>
            </nav>
          </header>

          <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>

          <footer className="bg-white border-t">
            <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
              <p>&copy; {new Date().getFullYear()} Soeumnono. All rights reserved.</p>
              <p className="mt-2">
                본 서비스는 사용자가 제공한 데이터를 기반으로 하며, 정보의 정확성에 대해 보증하지 않습니다.
              </p>
              {/* 쿠팡 파트너스 대가성 문구 추가 */}
              <p className="mt-2 text-xs">
                쿠팡 배너는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
