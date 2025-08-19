// /app/api/report/locations/route.ts
import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

// 네이버 Geocoding API 호출 함수
async function geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
  try {
    const response = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_MAP_CLIENT_ID!,
          'X-NCP-APIGW-API-KEY': process.env.NAVER_MAP_CLIENT_SECRET!,
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
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function GET() {
  try {
    const reportsRef = db.collection('reports');
    const snapshot = await reportsRef.get();
    const locations: { lat: number; lng: number; score: number }[] = [];

    // 병렬로 geocoding 처리
    const geocodePromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      // 이미 좌표가 있는 경우
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        return { lat: data.lat, lng: data.lng, score: data.score };
      }
      
      // 주소를 좌표로 변환
      if (data.address) {
        const coords = await geocodeAddress(data.address);
        if (coords) {
          return { ...coords, score: data.score };
        }
      }
      
      return null;
    });

    const results = await Promise.all(geocodePromises);
    
    // null이 아닌 유효한 결과만 필터링
    results.forEach(result => {
      if (result) {
        locations.push(result);
      }
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching report locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
