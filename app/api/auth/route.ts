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

// [POST] 로그인: 세션 쿠키 생성
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ status: 'success' }, { status: 200 });
    response.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn / 1000, // maxAge는 초 단위
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Session login error:', error);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 401 });
  }
}

// [GET] 인증 상태 확인
export async function GET() {
  const cookieStore = await cookies(); // ✅ 동기 함수로 호출
  const sessionCookie = cookieStore.get('session')?.value || '';

  if (!sessionCookie) {
    return NextResponse.json({ isAuthenticated: false, user: null }, { status: 200 });
  }

  try {
    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
    return NextResponse.json({ isAuthenticated: true, user: decodedClaims }, { status: 200 });
  } catch {
    return NextResponse.json({ isAuthenticated: false, user: null }, { status: 200 });
  }
}

// [DELETE] 로그아웃: 세션 쿠키 삭제
export async function DELETE() {
  try {
    const response = NextResponse.json({ status: 'success', message: 'Signed out successfully.' }, { status: 200 });
    response.cookies.set('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0), // 과거 날짜로 설정하여 즉시 만료
        path: '/',
    });
    return response;
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ error: 'Failed to sign out.' }, { status: 500 });
  }
}
