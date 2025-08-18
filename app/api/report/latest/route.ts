// /app/api/report/latest/route.ts
import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Report } from '@/types/report';

// Vercel의 서버 캐시를 사용하지 않도록 설정
export const dynamic = 'force-dynamic';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export async function GET() {
  try {
    const reportsRef = db.collection('reports');
    // createdAt 필드를 기준으로 내림차순 정렬하여 최신 5개만 가져옵니다.
    const querySnapshot = await reportsRef.orderBy('createdAt', 'desc').limit(5).get();

    const reports: Omit<Report, 'uid'>[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data() as Report;
      reports.push({
        id: doc.id,
        address: data.address,
        score: data.score,
        noiseTypes: data.noiseTypes,
        createdAt: data.createdAt,
      });
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching latest reports:', error);
    return NextResponse.json({ error: 'Failed to fetch latest reports.' }, { status: 500 });
  }
}
