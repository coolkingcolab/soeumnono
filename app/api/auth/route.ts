// /app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

// --- 시작: 이 부분은 사용자의 환경에 맞게 설정해야 합니다. ---

// TODO: Firebase 프로젝트 설정에서 생성한 서비스 계정 키(JSON 파일)를 준비하세요.
// 이 JSON 파일의 내용을 변환하여 아래 `serviceAccount` 객체에 붙여넣거나,
// Vercel 환경 변수 등으로 안전하게 관리해야 합니다.
// 로컬 개발 시에는 프로젝트 루트에 파일을 두고 경로를 참조할 수 있습니다.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};
// --- 종료: 설정 영역 ---


// Firebase Admin SDK 초기화 (이미 초기화된 경우 건너뛰기)
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

/**
 * @description 클라이언트에서 받은 ID 토큰으로 서버 측 세션 쿠키를 생성합니다. (로그인)
 * @method POST
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    // 세션 쿠키의 유효 기간 (예: 5일)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });

    // 응답 헤더에 세션 쿠키를 설정합니다.
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

/**
 * @description 현재 세션 쿠키를 확인하여 사용자 인증 상태를 반환합니다.
 * @method GET
 */
export async function GET(request: NextRequest) {
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


/**
 * @description 세션 쿠키를 만료시켜 로그아웃 처리합니다.
 * @method DELETE
 */
export async function DELETE(request: NextRequest) {
  try {
    // 세션 쿠키를 삭제합니다.
    cookies().delete('session');
    
    return NextResponse.json({ status: 'success', message: 'Signed out successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ error: 'Failed to sign out.' }, { status: 500 });
  }
}
