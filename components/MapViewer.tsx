// /components/MapViewer.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getReportLocations } from '@/lib/api';

// Naver Maps API 타입 정의
interface NaverMapInstance {
  setCenter: (latlng: NaverLatLngInstance) => void;
  setZoom: (zoom: number) => void;
  getBounds: () => object;
}
type NaverLatLngInstance = object;
interface NaverMarkerInstance {
    getElement: () => HTMLElement;
}

type NaverMap = new (element: HTMLElement, options: { center: NaverLatLngInstance; zoom: number }) => NaverMapInstance;
type NaverLatLng = new (lat: number, lng: number) => NaverLatLngInstance;
type NaverMarker = new (options: object) => NaverMarkerInstance;
type NaverPoint = new (x: number, y: number) => object;
type NaverSize = new (w: number, h: number) => object;

interface NaverService {
  geocode: (
    options: { query: string },
    callback: (status: number, response: GeocodeResponse) => void
  ) => void;
  Status: { OK: number };
}

interface GeocodeResponse {
  v2: {
    addresses: { x: string; y: string }[];
  };
}

declare global {
  interface Window {
    naver: {
      maps: {
        Map: NaverMap;
        LatLng: NaverLatLng;
        Marker: NaverMarker;
        Point: NaverPoint;
        Size: NaverSize;
        Event: {
          addListener: (map: NaverMapInstance, event: string, handler: (e?: object) => void) => void;
        };
        Service: NaverService;
        // clustering 서브모듈은 선택적으로 존재할 수 있음
        clustering?: {
          MarkerClustering: new (options: object) => void;
        };
      };
    };
    // 전역 MarkerClustering도 지원
    MarkerClustering?: new (options: object) => void;
  }
}

interface MapViewerProps {
  selectedAddress: string | null;
}

const MapViewer = ({ selectedAddress }: MapViewerProps) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);

  const loadScripts = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // 이미 로드되었는지 확인
      if (window.naver && window.MarkerClustering) {
        resolve();
        return;
      }

      // 1단계: 네이버 지도 기본 스크립트 로드
      if (!document.getElementById('naver-maps-script')) {
        const mapScript = document.createElement('script');
        mapScript.id = 'naver-maps-script';
        mapScript.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}&submodules=geocoder`;
        mapScript.async = true;
        document.head.appendChild(mapScript);

        mapScript.onload = () => {
          console.log('Naver Maps loaded');
          // 2단계: 마커 클러스터링 스크립트 로드
          loadClusteringScript().then(resolve).catch(reject);
        };
        mapScript.onerror = reject;
      } else if (window.naver) {
        // 지도는 로드되었지만 클러스터링이 없는 경우
        loadClusteringScript().then(resolve).catch(reject);
      }
    });
  }, []); // 빈 의존성 배열로 함수를 한 번만 생성

  const loadClusteringScript = () => {
    return new Promise<void>((resolve) => { // reject 매개변수 제거
      if (window.MarkerClustering) {
        resolve();
        return;
      }

      const clusteringScript = document.createElement('script');
      clusteringScript.id = 'marker-clustering-script';
      // 네이버 공식 GitHub에서 직접 로드
      clusteringScript.src = 'https://navermaps.github.io/maps.js.ncp/docs/js/MarkerClustering.js';
      clusteringScript.async = true;
      document.head.appendChild(clusteringScript);

      clusteringScript.onload = () => {
        console.log('MarkerClustering loaded');
        // 약간의 지연 후 확인
        setTimeout(() => {
          if (window.MarkerClustering) {
            resolve();
          } else {
            console.warn('MarkerClustering not available after load');
            resolve(); // 실패해도 지도는 표시
          }
        }, 100);
      };

      clusteringScript.onerror = (error) => {
        console.warn('Clustering script failed to load:', error);
        resolve(); // 실패해도 지도는 표시
      };
    });
  };

  const getScoreColor = (score: number) => {
    if (score < 2) return '#38bdf8';
    if (score < 3) return '#10b981';
    if (score < 4) return '#f59e0b';
    if (score < 4.5) return '#f97316';
    return '#ef4444';
  };

  useEffect(() => {
    loadScripts().then(() => {
      if (!mapElement.current || !window.naver) return;

      const map = new window.naver.maps.Map(mapElement.current, {
        center: new window.naver.maps.LatLng(37.5665, 126.9780),
        zoom: 13,
      });
      mapRef.current = map;

      getReportLocations().then(locations => {
        console.log('Locations loaded:', locations.length);
        
        if (locations.length === 0) {
          console.log('No locations to display');
          return;
        }

        // 네이버 공식 문서 방식으로 마커 생성
        const markers = locations.map(loc => {
            return new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(loc.lat, loc.lng),
                icon: {
                    content: `<div style="width:12px;height:12px;background-color:${getScoreColor(loc.score)};border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4);"></div>`,
                    anchor: new window.naver.maps.Point(6, 6),
                }
                // map 설정하지 않음 - 클러스터링에서 관리
            });
        });

        // 클러스터링 적용 (네이버 공식 문서 방식)
        if (window.MarkerClustering) {
          console.log('Applying MarkerClustering');
          
          // 네이버 공식 문서의 클러스터 아이콘 방식
          const htmlMarker1 = {
            content: '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:12px;color:white;text-align:center;font-weight:bold;background-color:#10b981;border-radius:50%;opacity:0.9;"></div>',
            size: new window.naver.maps.Size(40, 40),
            anchor: new window.naver.maps.Point(20, 20)
          };
          
          const htmlMarker2 = {
            content: '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:12px;color:white;text-align:center;font-weight:bold;background-color:#f59e0b;border-radius:50%;opacity:0.9;"></div>',
            size: new window.naver.maps.Size(40, 40),
            anchor: new window.naver.maps.Point(20, 20)
          };
          
          const htmlMarker3 = {
            content: '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:12px;color:white;text-align:center;font-weight:bold;background-color:#ef4444;border-radius:50%;opacity:0.9;"></div>',
            size: new window.naver.maps.Size(40, 40),
            anchor: new window.naver.maps.Point(20, 20)
          };

          try {
            // 네이버 공식 문서 방식으로 MarkerClustering 생성
            new window.MarkerClustering({
                minClusterSize: 2,
                maxZoom: 15,
                map: map,
                markers: markers,
                disableClickZoom: false,
                gridSize: 120,
                icons: [htmlMarker1, htmlMarker2, htmlMarker3],
                indexGenerator: [10, 50, 100],
                stylingFunction: function(clusterMarker: NaverMarkerInstance, count: number) {
                    // 타입을 NaverMarkerInstance로 변경
                    const element = clusterMarker.getElement();
                    const firstDiv = element.querySelector('div:first-child');
                    if (firstDiv) {
                        firstDiv.textContent = count.toString();
                    }
                }
            });
            console.log('MarkerClustering applied successfully');
          } catch (error) {
            console.warn('MarkerClustering failed, showing individual markers:', error);
            // 클러스터링 실패 시 개별 마커 표시
            markers.forEach(marker => marker.setMap(map));
          }
        } else {
          console.log('MarkerClustering not available, showing individual markers');
          // 클러스터링이 없으면 개별 마커 표시
          markers.forEach(marker => marker.setMap(map));
        }
      }).catch(console.error);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedAddress && mapRef.current && window.naver) {
      window.naver.maps.Service.geocode({
        query: selectedAddress,
      }, (status, response) => {
        if (status !== window.naver.maps.Service.Status.OK) return;
        const result = response.v2.addresses[0];
        if (result) {
          const point = new window.naver.maps.LatLng(Number(result.y), Number(result.x));
          mapRef.current?.setCenter(point);
          mapRef.current?.setZoom(17);
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
