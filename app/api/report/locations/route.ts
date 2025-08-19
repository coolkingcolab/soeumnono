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

export async function GET() {
  try {
    console.log('=== Location API 호출 시작 ===');
    const reportsRef = db.collection('reports');
    const snapshot = await reportsRef.get();
    console.log('총 문서 수:', snapshot.size);
    
    const locations: { lat: number; lng: number; score: number }[] = [];

    // 병렬로 geocoding 처리
    const geocodePromises = snapshot.docs.map(async (doc, index) => {
      const data = doc.data();
      console.log(`문서 ${index + 1}:`, { address: data.address, hasLat: !!data.lat, hasLng: !!data.lng });
      
      // 이미 좌표가 있는 경우
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        console.log(`문서 ${index + 1}: 기존 좌표 사용`);
        return { lat: data.lat, lng: data.lng, score: data.score };
      }
      
      // 주소를 좌표로 변환
      if (data.address) {
        console.log(`문서 ${index + 1}: geocoding 시도 - ${data.address}`);
        const coords = await geocodeAddress(data.address);
        if (coords) {
          console.log(`문서 ${index + 1}: geocoding 성공`);
          return { ...coords, score: data.score };
        } else {
          console.log(`문서 ${index + 1}: geocoding 실패`);
        }
      }
      
      return null;
    });

    const results = await Promise.all(geocodePromises);
    console.log('유효한 결과 수:', results.filter(r => r !== null).length);
    
    // null이 아닌 유효한 결과만 필터링
    results.forEach(result => {
      if (result) {
        locations.push(result);
      }
    });

    console.log('최종 locations 수:', locations.length);
    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching report locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
