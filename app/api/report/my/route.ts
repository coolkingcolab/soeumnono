// /app/api/report/my/route.ts
import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore'; // Timestamp import 제거
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
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
const auth = getAuth();

async function verifyUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value || '';
  if (!sessionCookie) return null;

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch {
    return null;
  }
}

export async function GET() {
  const uid = await verifyUser();
  if (!uid) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const reportsRef = db.collection('reports');
    const querySnapshot = await reportsRef.where('uid', '==', uid).orderBy('createdAt', 'desc').get();

    const myReports: Report[] = [];
    querySnapshot.forEach(doc => {
      myReports.push({ id: doc.id, ...doc.data() } as Report);
    });

    return NextResponse.json(myReports);
  } catch (error) {
    console.error('Error fetching my reports:', error);
    return NextResponse.json({ error: 'Failed to fetch my reports' }, { status: 500 });
  }
}
