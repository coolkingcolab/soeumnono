// /app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css'; // Tailwind CSS 포함
import MetaTags from '@/components/MetaTags';
import AuthButton from '@/components/AuthButton';

const inter = Inter({ subsets: ['latin'] });

// 기본 SEO 메타데이터 설정
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
        {/* 기본 메타 태그 및 소셜 공유용 태그 렌더링 */}
        <MetaTags
          title="소음노노 - 우리 동네 층간소음 확인하기"
          description="지도 기반으로 우리 동네, 우리 아파트의 층간소음 정보를 확인하고 직접 평가를 남겨보세요."
          url="https://soeumnono.com" // 실제 서비스 도메인으로 변경 필요
          imageUrl="https://soeumnono.com/og-image.png" // OG 이미지 경로
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

        {/* Google AdSense 스크립트 */}
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
          {/* 헤더 */}
          <header className="sticky top-0 z-50 bg-white shadow-md">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex-shrink-0">
                  <a href="/" className="text-2xl font-bold text-blue-600">
                    소음노노
                  </a>
                </div>
                <div className="flex items-center">
                  {/* 로그인 버튼 */}
                  <AuthButton />
                </div>
              </div>
            </nav>
          </header>

          {/* 메인 콘텐츠 */}
          <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>

          {/* 푸터 */}
          <footer className="bg-white border-t">
            <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
              <p>&copy; {new Date().getFullYear()} Soeumnono. All rights reserved.</p>
              <p className="mt-2">
                본 서비스는 사용자가 제공한 데이터를 기반으로 하며, 정보의 정확성에 대해 보증하지 않습니다.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
