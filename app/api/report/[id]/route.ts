// /app/api/report/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

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
    return (await auth.verifySessionCookie(sessionCookie, true)).uid;
  } catch {
    return null;
  }
}

// PUT: 평가 수정
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const uid = await verifyUser();
  if (!uid) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = params;
  const { score, noiseTypes } = await request.json();

  if (!id || typeof score !== 'number' || !Array.isArray(noiseTypes)) {
    return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
  }

  try {
    const reportRef = db.collection('reports').doc(id);
    const doc = await reportRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // 본인의 평가만 수정할 수 있도록 확인
    if (doc.data()?.uid !== uid) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    await reportRef.update({ score, noiseTypes });

    return NextResponse.json({ message: 'Report updated successfully' });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
