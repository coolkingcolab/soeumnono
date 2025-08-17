// /app/api/report/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Report } from '@/types/report';

// --- 시작: 이 부분은 사용자의 환경에 맞게 설정해야 합니다. ---
// TODO: Firebase 서비스 계정 키 설정 (다른 API 라우트와 동일)
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};
// --- 종료: 설정 영역 ---

// Firebase Admin SDK 초기화
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export interface ReportSummary {
  address: string;
  averageScore: number;
  reportCount: number;
}

/**
 * @description 모든 평가 데이터를 집계하여 주소별 평균 점수 및 평가 수를 반환합니다. (히트맵용)
 * @method GET
 */
export async function GET(request: NextRequest) {
  try {
    const reportsRef = db.collection('reports');
    const snapshot = await reportsRef.get();

    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    // 주소별로 점수 합계와 개수를 저장하기 위한 객체
    const summaryMap: { [address: string]: { totalScore: number; count: number } } = {};

    snapshot.forEach(doc => {
      const report = doc.data() as Report;
      if (summaryMap[report.address]) {
        summaryMap[report.address].totalScore += report.score;
        summaryMap[report.address].count += 1;
      } else {
        summaryMap[report.address] = {
          totalScore: report.score,
          count: 1,
        };
      }
    });

    // 최종 반환할 배열 형태로 변환
    const result: ReportSummary[] = Object.entries(summaryMap).map(([address, data]) => ({
      address,
      averageScore: data.totalScore / data.count,
      reportCount: data.count,
    }));

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error fetching report summary:', error);
    return NextResponse.json({ error: 'Failed to fetch report summary.' }, { status: 500 });
  }
}
