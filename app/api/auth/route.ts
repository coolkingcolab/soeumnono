// /app/api/auth/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

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

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });

    cookies().set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
    });

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Session login error:', error);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 401 });
  }
}

export async function GET() { // 사용하지 않는 request 파라미터 제거
    const sessionCookie = cookies().get('session')?.value || '';

    if (!sessionCookie) {
        return NextResponse.json({ isAuthenticated: false, user: null }, { status: 200 });
    }

    try {
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
        return NextResponse.json({ isAuthenticated: true, user: decodedClaims }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ isAuthenticated: false, user: null }, { status: 200 });
    }
}

export async function DELETE() { // 사용하지 않는 request 파라미터 제거
  try {
    cookies().delete('session');
    return NextResponse.json({ status: 'success', message: 'Signed out successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ error: 'Failed to sign out.' }, { status: 500 });
  }
}
