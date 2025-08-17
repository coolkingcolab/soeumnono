// /components/MetaTags.tsx
import React from 'react';

interface MetaTagsProps {
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
}

const MetaTags: React.FC<MetaTagsProps> = ({
  title = '소음노노 - 우리 동네 층간소음 확인하기',
  description = '지도 기반으로 우리 동네, 우리 아파트의 층간소음 정보를 확인하고 직접 평가를 남겨보세요.',
  url = 'https://soeumnono.com', // TODO: 실제 서비스 도메인으로 변경 필요
  imageUrl = 'https://soeumnono.com/og-image.png', // TODO: 기본 OG 이미지 경로로 변경 필요
}) => {
  return (
    <>
      {/* Standard SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="소음노노" />
      <meta property="og:locale" content="ko_KR" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageUrl} />
    </>
  );
};

export default MetaTags;
