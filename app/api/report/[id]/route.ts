// /app/api/report/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
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

// ✅ 올바른 수정: params를 Promise<{ id: string }>로 타입 지정
export async function PUT(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }  // Promise로 감싸야 함
) {
  const uid = await verifyUser();
  if (!uid) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // ✅ params를 await로 해결
  const { id } = await context.params;  // await 추가 필수
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
