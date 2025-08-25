// /lib/api.ts
import { Report } from '@/types/report';
import { ReportSummary } from '@/app/api/report/summary/route';
import { RankedLocation } from '@/app/api/ranking/route';

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

export const getLatestReports = async (): Promise<Omit<Report, 'uid'>[]> => {
    const response = await fetch(`${API_BASE_URL}/report/latest`, { cache: 'no-store' });
    return handleResponse(response);
};

// API 응답 타입에 address 추가
export const getReportLocations = async (): Promise<{ lat: number; lng: number; score: number; address: string; }[]> => {
    const response = await fetch(`${API_BASE_URL}/report/locations`, { cache: 'no-store' });
    return handleResponse(response);
};

export const getRanking = async (): Promise<RankedLocation[]> => {
    const response = await fetch(`${API_BASE_URL}/ranking`, { cache: 'no-store' });
    return handleResponse(response);
};

// 나의 평가 기록을 가져오는 API 호출 함수
export const getMyReports = async (): Promise<Report[]> => {
    const response = await fetch(`${API_BASE_URL}/report/my`, { cache: 'no-store' });
    return handleResponse(response);
};

// 특정 평가를 수정하는 API 호출 함수
export const updateReport = async (id: string, reportData: { score: number; noiseTypes: string[] }) => {
    const response = await fetch(`${API_BASE_URL}/report/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
    });
    return handleResponse(response);
};
