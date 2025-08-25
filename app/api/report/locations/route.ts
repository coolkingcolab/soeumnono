// /app/api/report/locations/route.ts
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

export async function GET() {
  try {
    const reportsRef = db.collection('reports');
    const snapshot = await reportsRef.get();

    const locations: { lat: number; lng: number; score: number; address: string }[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as Report;
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        locations.push({
          lat: data.lat,
          lng: data.lng,
          score: data.score,
          address: data.address, // 주소 정보 추가
        });
      }
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching report locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
