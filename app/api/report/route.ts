// /app/api/report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { Report } from '@/types/report';

// --- 시작: 이 부분은 사용자의 환경에 맞게 설정해야 합니다. ---
// TODO: Firebase 서비스 계정 키 설정 (auth/route.ts와 동일)
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};
// --- 종료: 설정 영역 ---

// Firebase Admin SDK 초기화
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
const auth = getAuth();

/**
 * @description 인증된 사용자의 세션 쿠키를 확인하고 UID를 반환합니다.
 * @returns Promise<string | null> - 인증된 사용자의 UID 또는 null
 */
async function verifyUser(): Promise<string | null> {
  const sessionCookie = cookies().get('session')?.value || '';
  if (!sessionCookie) return null;

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    return null;
  }
}

/**
 * @description 평가 등록 (POST) 및 조회/자격 확인 (GET) API
 */

// GET: 주소별 평가 목록 조회 또는 현재 사용자의 평가 가능 여부 확인
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const checkEligibility = searchParams.get('checkEligibility');

  // 1. 평가 자격 확인 요청 처리
  if (checkEligibility === 'true') {
    const uid = await verifyUser();
    if (!uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const reportsRef = db.collection('reports');
    const querySnapshot = await reportsRef.where('uid', '==', uid).get();

    if (querySnapshot.empty) {
      return NextResponse.json({ eligible: true });
    }

    let latestReport: Report | null = null;
    querySnapshot.forEach(doc => {
        const data = doc.data() as Report;
        if (!latestReport || data.createdAt > latestReport.createdAt) {
            latestReport = data;
        }
    });

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Firestore Timestamp를 JavaScript Date 객체로 변환
    const latestReportDate = new Date((latestReport!.createdAt as any)._seconds * 1000);

    if (latestReportDate > oneYearAgo) {
      return NextResponse.json({ eligible: false, reason: 'A report has been submitted within the last year.' });
    }

    return NextResponse.json({ eligible: true });
  }

  // 2. 특정 주소의 평가 목록 조회 요청 처리
  if (address) {
    const reportsRef = db.collection('reports');
    const querySnapshot = await reportsRef.where('address', '==', address).get();
    
    const reports: Omit<Report, 'uid'>[] = []; // uid를 제외하고 반환
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
  }

  return NextResponse.json({ error: 'Invalid request. Provide "address" or "checkEligibility".' }, { status: 400 });
}


// POST: 새로운 평가 등록
export async function POST(request: NextRequest) {
  const uid = await verifyUser();
  if (!uid) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { address, score, noiseTypes } = await request.json();

    // 데이터 유효성 검사
    if (!address || typeof score !== 'number' || !Array.isArray(noiseTypes)) {
      return NextResponse.json({ error: 'Invalid data provided.' }, { status: 400 });
    }

    // --- 중복 평가 방지 로직 (1년 1회) ---
    const reportsRef = db.collection('reports');
    const querySnapshot = await reportsRef.where('uid', '==', uid).get();
    
    if (!querySnapshot.empty) {
        let latestReport: Report | null = null;
        querySnapshot.forEach(doc => {
            const data = doc.data() as Report;
            if (!latestReport || data.createdAt > latestReport.createdAt) {
                latestReport = data;
            }
        });
        
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const latestReportDate = new Date((latestReport!.createdAt as any)._seconds * 1000);

        if (latestReportDate > oneYearAgo) {
            return NextResponse.json({ error: 'You can only submit one report per year.' }, { status: 429 });
        }
    }
    // --- 중복 평가 방지 로직 종료 ---

    const newReport: Omit<Report, 'id'> = {
      uid,
      address,
      score,
      noiseTypes,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('reports').add(newReport);

    return NextResponse.json({ id: docRef.id, ...newReport }, { status: 201 });

  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json({ error: 'Failed to submit report.' }, { status: 500 });
  }
}
