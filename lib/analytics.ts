// /lib/analytics.ts

// gtag.js가 window 객체에 타입 정의가 되어있지 않으므로, 전역으로 선언해줍니다.
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: { [key: string]: any }
    ) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

/**
 * @description 페이지뷰를 Google Analytics로 전송합니다.
 * Next.js의 라우터 이벤트와 함께 사용하면 페이지 이동 시 자동으로 추적할 수 있습니다.
 * @param url - 추적할 페이지의 URL
 */
export const pageview = (url: string) => {
  if (GA_TRACKING_ID && typeof window.gtag === 'function') {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

/**
 * @description 특정 이벤트를 Google Analytics로 전송합니다.
 * @param action - 이벤트 액션 (예: 'submit_report')
 * @param category - 이벤트 카테고리 (예: 'engagement')
 * @param label - 이벤트 라벨 (예: '평가 제출 버튼 클릭')
 * @param value - 이벤트 값 (숫자)
 */
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  if (GA_TRACKING_ID && typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
