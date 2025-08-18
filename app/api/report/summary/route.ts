// /app/api/report/summary/route.ts
import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Report } from '@/types/report';

// Vercel의 서버 캐시를 사용하지 않도록 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0; // 캐시 유효 시간을 0으로 설정

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

const db = getFirestore();

export interface ReportSummary {
  address: string;
  averageScore: number;
  reportCount: number;
}

export async function GET() { // 사용하지 않는 request 파라미터 제거
  try {
    const reportsRef = db.collection('reports');
    const snapshot = await reportsRef.get();

    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

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
