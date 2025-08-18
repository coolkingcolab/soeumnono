// /app/api/ranking/route.ts
import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Report } from '@/types/report';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

export interface RankedLocation {
  address: string;
  averageScore: number;
  reportCount: number;
}

export async function GET() {
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

    const allLocations: RankedLocation[] = Object.entries(summaryMap).map(([address, data]) => ({
      address,
      averageScore: data.totalScore / data.count,
      reportCount: data.count,
    }));

    // 평가가 3개 이상인 장소만 필터링
    const filteredLocations = allLocations.filter(loc => loc.reportCount >= 3);

    // 평균 점수가 낮은 순서(조용한 순서)로 정렬
    const sortedLocations = filteredLocations.sort((a, b) => a.averageScore - b.averageScore);

    // 상위 5개만 반환
    const top5 = sortedLocations.slice(0, 5);

    return NextResponse.json(top5, { status: 200 });

  } catch (error) {
    console.error('Error fetching ranking:', error);
    return NextResponse.json({ error: 'Failed to fetch ranking.' }, { status: 500 });
  }
}
