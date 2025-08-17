// /components/MapViewer.tsx
'use client';

import { useEffect, useRef } from 'react';

// Naver Maps API에서 사용하는 타입들을 전역으로 선언
declare global {
  interface Window {
    naver: any;
  }
}

interface MapViewerProps {
  selectedAddress: string | null;
  onMapClick: (address: string) => void;
}

const MapViewer = ({ selectedAddress, onMapClick }: MapViewerProps) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // naver.maps.Map 인스턴스를 저장할 ref

  // 네이버 지도 스크립트를 동적으로 로드하는 함수
  const loadNaverMapsScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (document.getElementById('naver-maps-script')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'naver-maps-script';
      // TODO: .env.local 파일에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 설정해야 합니다.
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}&submodules=geocoder`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
    });
  };

  // 1. 컴포넌트 마운트 시 지도 초기화
  useEffect(() => {
    loadNaverMapsScript().then(() => {
      if (!mapElement.current || !window.naver) return;

      const mapOptions = {
        center: new window.naver.maps.LatLng(37.5665, 126.9780), // 기본 위치: 서울 시청
        zoom: 16,
      };

      const map = new window.naver.maps.Map(mapElement.current, mapOptions);
      mapRef.current = map;

      // 지도 클릭 이벤트 리스너 추가
      window.naver.maps.Event.addListener(map, 'click', (e: any) => {
        const latlng = e.coord;
        
        // 클릭한 위치의 좌표를 주소로 변환 (Reverse Geocoding)
        window.naver.maps.Service.reverseGeocode({
          coords: latlng,
          orders: [
            window.naver.maps.Service.OrderType.ADDR, // 도로명 주소
            window.naver.maps.Service.OrderType.ROAD_ADDR, // 지번 주소
          ].join(','),
        }, (status: any, response: any) => {
          if (status !== window.naver.maps.Service.Status.OK) {
            return alert('주소를 찾는 데 실패했습니다.');
          }

          const result = response.v2;
          const roadAddress = result.address.roadAddress;
          
          // 예: "서울특별시 중구 세종대로 110" + "상세 건물명"
          // 실제 서비스에서는 건물명이 중요하므로, buildingName을 우선적으로 사용
          const buildingName = result.results[0]?.land?.name || '';
          const finalAddress = buildingName ? `${roadAddress} ${buildingName}` : roadAddress;
          
          if (finalAddress) {
            onMapClick(finalAddress);
          }
        });
      });
    }).catch(console.error);
  }, [onMapClick]);

  // 2. selectedAddress prop이 변경될 때 지도 위치 이동
  useEffect(() => {
    if (selectedAddress && mapRef.current && window.naver) {
      // 주소를 좌표로 변환 (Geocoding)
      window.naver.maps.Service.geocode({
        query: selectedAddress,
      }, (status: any, response: any) => {
        if (status !== window.naver.maps.Service.Status.OK) {
          return;
        }

        const result = response.v2.addresses[0];
        if (result) {
          const point = new window.naver.maps.LatLng(result.y, result.x);
          mapRef.current.setCenter(point);
          mapRef.current.setZoom(17);

          // 해당 위치에 마커 표시
          new window.naver.maps.Marker({
            position: point,
            map: mapRef.current,
          });
        }
      });
    }
  }, [selectedAddress]);

  return (
    <div
      ref={mapElement}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default MapViewer;
