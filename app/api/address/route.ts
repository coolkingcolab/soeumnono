// /app/api/address/route.ts
import { NextRequest, NextResponse } from 'next/server';

// API 응답의 juso 객체 타입을 정의
interface Juso {
  roadAddr: string; // 전체 도로명 주소
  bdNm: string;     // 상세 건물명
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');

  if (!keyword) {
    return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
  }

  const apiKey = process.env.ROAD_NAME_API_KEY;
  if (!apiKey) {
    console.error('ROAD_NAME_API_KEY is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  
  const apiUrl = `https://business.juso.go.kr/addrlink/addrLinkApi.do?confmKey=${apiKey}&currentPage=1&countPerPage=10&keyword=${encodeURIComponent(
    keyword
  )}&resultType=json`;

  try {
    const apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok) {
      throw new Error('Failed to fetch address data from API');
    }
    const data = await apiResponse.json();

    // API 결과에서 "도로명주소 + 상세건물명" 형태의 주소 목록만 추출
    const addresses = data.results?.juso?.map((item: Juso) => {
      // 상세건물명이 있는 경우에만 조합
      return item.bdNm ? `${item.roadAddr} ${item.bdNm}` : item.roadAddr;
    }) || [];
    
    // 중복 제거
    const uniqueAddresses = [...new Set(addresses)];

    return NextResponse.json({ addresses: uniqueAddresses });

  } catch (error) {
    console.error('Address API error:', error);
    return NextResponse.json({ error: 'Failed to fetch address data' }, { status: 500 });
  }
}
