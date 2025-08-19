// /app/api/report/locations/route.ts
import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Report } from '@/types/report';

export const dynamic = 'force-dynamic';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// 다른 API 라우트에서 이미 초기화되었을 수 있으므로 확인 후 초기화
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

export async function GET() {
  try {
    const reportsRef = db.collection('reports');
    const snapshot = await reportsRef.get();

    const locations: { lat: number; lng: number; score: number }[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as Report;
      // 좌표 정보가 있는 평가만 필터링
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        locations.push({
          lat: data.lat,
          lng: data.lng,
          score: data.score,
        });
      }
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching report locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
