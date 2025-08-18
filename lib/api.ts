// /lib/api.ts
import { Report } from '@/types/report';
import { ReportSummary } from '@/app/api/report/summary/route';

const API_BASE_URL = '/api';

async function handleResponse(response: Response) {
  if (response.ok) {
    return response.json();
  }
  const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
  throw new Error(errorData.error || `Request failed with status ${response.status}`);
}

export const submitReport = async (reportData: { address: string; score: number; noiseTypes: string[] }) => {
  const response = await fetch(`${API_BASE_URL}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData),
  });
  return handleResponse(response);
};

export const getReports = async (address: string): Promise<Omit<Report, 'uid'>[]> => {
  // fetch 요청에 cache: 'no-store' 옵션을 추가하여 항상 최신 데이터를 가져오도록 설정
  const response = await fetch(`${API_BASE_URL}/report?address=${encodeURIComponent(address)}`, { cache: 'no-store' });
  return handleResponse(response);
};

export const checkEligibility = async (): Promise<{ eligible: boolean; reason?: string }> => {
  const response = await fetch(`${API_BASE_URL}/report?checkEligibility=true`, { cache: 'no-store' });
  return handleResponse(response);
};

export const getReportSummary = async (): Promise<ReportSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/report/summary`, { cache: 'no-store' });
  return handleResponse(response);
};

// 실시간 피드를 위한 새로운 API 호출 함수 추가
export const getLatestReports = async (): Promise<Omit<Report, 'uid'>[]> => {
    const response = await fetch(`${API_BASE_URL}/report/latest`, { cache: 'no-store' });
    return handleResponse(response);
};
