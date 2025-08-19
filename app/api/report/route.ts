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

// 주소기반산업지원서비스 API 호출 함수
async function geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
  const apiKey = process.env.ROAD_NAME_API_KEY;
  if (!apiKey) {
    console.error('ROAD_NAME_API_KEY is not set');
    return null;
  }
  
  const apiUrl = `https://business.juso.go.kr/addrlink/addrLinkApi.do?confmKey=${apiKey}&currentPage=1&countPerPage=1&keyword=${encodeURIComponent(
    address
  )}&resultType=json&addInfoYn=Y`;

  try {
    const response = await fetch(apiUrl);
    
    console.log("주소 API 응답 상태:", response.status);
    const responseText = await response.text();
    console.log("주소 API 응답 내용:", responseText);

    const data = JSON.parse(responseText);
    
    if (data.results?.juso && data.results.juso.length > 0) {
      const result = data.results.juso[0];
      if (result.entY && result.entX) {
        const coords = {
          lat: parseFloat(result.entY),
          lng: parseFloat(result.entX)
        };
        console.log('변환된 좌표:', coords);
        return coords;
      }
    }
    console.log('geocoding 결과 없음');
    return null;
  } catch (error) {
    console.error('Geocoding error with juso.go.kr:', error);
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
    const querySnapshot = await reportsRef.get();
    
    const allReports: Report[] = [];
    querySnapshot.forEach(doc => {
        allReports.push({ id: doc.id, ...doc.data() } as Report);
    });

    const normalizedSearch = address.replace(/\s+/g, '');

    const filteredReports = allReports.filter(report => {
        const normalizedDbAddress = report.address.replace(/\s+/g, '');
        return normalizedDbAddress === normalizedSearch;
    });

    const reportsToReturn = filteredReports.map(({ uid: _, ...rest }) => rest);

    return NextResponse.json(reportsToReturn);
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

    // 주소를 좌표로 변환
    console.log('새 보고서 생성 - 주소:', address);
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
      // 좌표가 있으면 추가, 없으면 undefined (선택적 필드)
      ...(coordinates && { lat: coordinates.lat, lng: coordinates.lng })
    };

    console.log('저장할 보고서 데이터:', { 
      address, 
      score, 
      hasCoordinates: !!coordinates,
      coordinates 
    });

    const docRef = await db.collection('reports').add(newReport);

    return NextResponse.json({ id: docRef.id, ...newReport }, { status: 201 });

  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json({ error: 'Failed to submit report.' }, { status: 500 });
  }
}
