// /app/api/report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { Report } from '@/types/report';

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
  // 오타 수정: search_params -> searchParams
  const checkEligibility = searchParams.get('checkEligibility');

  if (checkEligibility === 'true') {
    const uid = await verifyUser();
    if (!uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // --- 테스트 사용자 예외 처리 ---
    if (uid === process.env.TEST_USER_UID) {
      console.log('Test user detected, skipping eligibility check.');
      return NextResponse.json({ eligible: true });
    }
    // --- 테스트 사용자 예외 처리 끝 ---

    const reportsRef = db.collection('reports');
    const querySnapshot = await reportsRef.where('uid', '==', uid).get();

    if (querySnapshot.empty) {
      return NextResponse.json({ eligible: true });
    }

    let latestReport: Report | null = null;
    querySnapshot.forEach(doc => {
        const data = doc.data() as Report;
        if (!latestReport || (data.createdAt as Timestamp).toMillis() > (latestReport.createdAt as Timestamp).toMillis()) {
            latestReport = data;
        }
    });

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const latestReportDate = (latestReport!.createdAt as Timestamp).toDate();

    if (latestReportDate > oneYearAgo) {
      return NextResponse.json({ eligible: false, reason: 'A report has been submitted within the last year.' });
    }

    return NextResponse.json({ eligible: true });
  }

  if (address) {
    const reportsRef = db.collection('reports');
    const querySnapshot = await reportsRef.where('address', '==', address).get();
    
    const reports: Omit<Report, 'uid'>[] = [];
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

    // --- 테스트 사용자 예외 처리 ---
    const isTestUser = uid === process.env.TEST_USER_UID;
    if (!isTestUser) {
        const reportsRef = db.collection('reports');
        const querySnapshot = await reportsRef.where('uid', '==', uid).get();
        
        if (!querySnapshot.empty) {
            let latestReport: Report | null = null;
            querySnapshot.forEach(doc => {
                const data = doc.data() as Report;
                if (!latestReport || (data.createdAt as Timestamp).toMillis() > (latestReport.createdAt as Timestamp).toMillis()) {
                    latestReport = data;
                }
            });
            
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const latestReportDate = (latestReport!.createdAt as Timestamp).toDate();

            if (latestReportDate > oneYearAgo) {
                return NextResponse.json({ error: 'You can only submit one report per year.' }, { status: 429 });
            }
        }
    }
    // --- 테스트 사용자 예외 처리 끝 ---

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
