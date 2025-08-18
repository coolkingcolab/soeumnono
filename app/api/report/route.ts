// /app/api/report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
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
  initializeApp({
    credential: cert(serviceAccount),
  });
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const checkEligibility = searchParams.get('checkEligibility');

  if (checkEligibility === 'true') {
    // ... (평가 자격 확인 로직은 이전과 동일)
    // (이하 생략)
  }

  if (address) {
    // --- 검색 로직 최종 개선 ---
    const reportsRef = db.collection('reports');
    const querySnapshot = await reportsRef.get();
    
    const allReports: Report[] = [];
    querySnapshot.forEach(doc => {
        allReports.push({ id: doc.id, ...doc.data() } as Report);
    });

    // 1. 검색어에서 모든 공백을 제거하여 정규화합니다.
    const normalizedSearch = address.replace(/\s+/g, '');

    // 2. DB의 주소도 공백을 모두 제거한 뒤, '정확히 일치'하는지 비교합니다.
    const filteredReports = allReports.filter(report => {
        const normalizedDbAddress = report.address.replace(/\s+/g, '');
        return normalizedDbAddress === normalizedSearch;
    });
    // --- 검색 로직 끝 ---

    const reportsToReturn: Omit<Report, 'uid'>[] = filteredReports.map(report => {
        const { uid, ...rest } = report;
        return rest;
    });

    return NextResponse.json(reportsToReturn);
  }

  return NextResponse.json({ error: 'Invalid request. Provide "address" or "checkEligibility".' }, { status: 400 });
}

// ... (POST 함수는 이전과 동일)
export async function POST(request: NextRequest) {
  const uid = await verifyUser();
  if (!uid) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { address, score, noiseTypes } = await request.json();

    if (!address || typeof score !== 'number' || !Array.isArray(noiseTypes)) {
      return NextResponse.json({ error: 'Invalid data provided.' }, { status: 400 });
    }
    
    const isTestUser = uid === process.env.TEST_USER_UID;

    if (!isTestUser) {
        const reportsRef = db.collection('reports');
        const querySnapshot = await reportsRef.where('uid', '==', uid).get();
        const reportCount = querySnapshot.size;

        if (reportCount >= 5) {
            let latestReport: Report | null = null;
            querySnapshot.forEach(doc => {
                const data = doc.data() as Report;
                if (!latestReport || (data.createdAt as Timestamp).toMillis() > (latestReport.createdAt as Timestamp).toMillis()) {
                    latestReport = data;
                }
            });

            const sixMonthsInMillis = 180 * 24 * 60 * 60 * 1000;
            const lastReportTime = (latestReport!.createdAt as Timestamp).toMillis();
            const now = new Date().getTime();

            if (now - lastReportTime <= sixMonthsInMillis) {
                return NextResponse.json({ error: '6개월마다 한 번만 평가를 등록할 수 있습니다.' }, { status: 429 });
            }
        }
    }

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
