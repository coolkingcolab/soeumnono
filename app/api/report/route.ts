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

// Geocoding 함수를 안정적인 네이버 API로 수정
async function geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
  try {
    const response = await fetch(
      `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'x-ncp-apigw-api-key-id': process.env.NAVER_API_CLIENT_ID!,
          'x-ncp-apigw-api-key': process.env.NAVER_API_CLIENT_SECRET!,
        },
      }
    );
    
    const data = await response.json();

    if (data.addresses && data.addresses.length > 0) {
      const result = data.addresses[0];
      return {
        lat: parseFloat(result.y),
        lng: parseFloat(result.x)
      };
    }
    return null;
  } catch (error) {
    console.error('Naver Geocoding error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const checkEligibility = searchParams.get('checkEligibility');

  if (checkEligibility === 'true') {
    const uid = await verifyUser();
    if (!uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (uid === process.env.TEST_USER_UID) {
      return NextResponse.json({ eligible: true });
    }

    const reportsRef = db.collection('reports');
    const querySnapshot = await reportsRef.where('uid', '==', uid).get();
    const reportCount = querySnapshot.size;

    if (reportCount < 5) {
      return NextResponse.json({ eligible: true, reason: `Initial reports allowed: ${reportCount}/5` });
    }

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

    if (now - lastReportTime > sixMonthsInMillis) {
      return NextResponse.json({ eligible: true });
    } else {
      return NextResponse.json({ eligible: false, reason: 'You can submit a new report every 6 months after the initial 5 reports.' });
    }
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

    const coordinates = await geocodeAddress(address);
    
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
      ...(coordinates && { lat: coordinates.lat, lng: coordinates.lng })
    };

    const docRef = await db.collection('reports').add(newReport);

    return NextResponse.json({ id: docRef.id, ...newReport }, { status: 201 });

  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json({ error: 'Failed to submit report.' }, { status: 500 });
  }
}
