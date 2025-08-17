// /lib/api.ts
import { Report } from '@/types/report';
import { ReportSummary } from '@/app/api/report/summary/route';

const API_BASE_URL = '/api';

/**
 * @description 서버 응답을 처리하는 헬퍼 함수
 * @param response Fetch API의 응답 객체
 */
async function handleResponse(response: Response) {
  if (response.ok) {
    return response.json();
  }
  // 에러 응답의 경우, body에서 에러 메시지를 파싱하여 throw
  const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
  throw new Error(errorData.error || `Request failed with status ${response.status}`);
}

/**
 * @description 새로운 소음 평가를 서버에 제출합니다.
 * @param reportData - { address, score, noiseTypes }
 */
export const submitReport = async (reportData: { address: string; score: number; noiseTypes: string[] }) => {
  const response = await fetch(`${API_BASE_URL}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });
  return handleResponse(response);
};

/**
 * @description 특정 주소에 대한 평가 목록을 가져옵니다.
 * @param address - 조회할 주소 문자열
 */
export const getReports = async (address: string): Promise<Omit<Report, 'uid'>[]> => {
  const response = await fetch(`${API_BASE_URL}/report?address=${encodeURIComponent(address)}`);
  return handleResponse(response);
};

/**
 * @description 현재 로그인한 사용자가 평가를 제출할 자격이 있는지 확인합니다. (연 1회)
 */
export const checkEligibility = async (): Promise<{ eligible: boolean; reason?: string }> => {
  const response = await fetch(`${API_BASE_URL}/report?checkEligibility=true`);
  return handleResponse(response);
};

/**
 * @description 히트맵 및 통계에 사용할 전체 리포트 요약 데이터를 가져옵니다.
 */
export const getReportSummary = async (): Promise<ReportSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/report/summary`);
  return handleResponse(response);
};
