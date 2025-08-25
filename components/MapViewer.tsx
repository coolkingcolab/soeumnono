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
    setMap: (map: NaverMapInstance | null) => void;
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
          addListener: (target: object, eventName: string, handler: (e?: object) => void) => void;
        };
        Service: NaverService;
      };
    };
    MarkerClustering: new (options: object) => void;
  }
}

interface MapViewerProps {
  selectedAddress: string | null;
  onMarkerClick: (address: string) => void;
}

const MapViewer = ({ selectedAddress, onMarkerClick }: MapViewerProps) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);

  // onMarkerClick 함수가 변경되어도 useEffect가 재실행되지 않도록 ref로 관리
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  });

  const loadClusteringScript = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (window.MarkerClustering) {
        resolve();
        return;
      }

      if (document.getElementById('marker-clustering-script')) {
        // 스크립트가 이미 추가되었지만 MarkerClustering이 아직 없는 경우 대기
        const checkInterval = setInterval(() => {
          if (window.MarkerClustering) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 5000);
        return;
      }

      const clusteringScript = document.createElement('script');
      clusteringScript.id = 'marker-clustering-script';
      // 원래 작동하던 URL 사용
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
            resolve();
          }
        }, 100);
      };
      
      clusteringScript.onerror = (error) => {
        console.warn('Clustering script failed to load:', error);
        resolve(); // 실패해도 지도는 표시
      };
    });
  }, []);

  const loadScripts = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.naver && window.MarkerClustering) {
        resolve();
        return;
      }

      if (!document.getElementById('naver-maps-script')) {
        const mapScript = document.createElement('script');
        mapScript.id = 'naver-maps-script';
        mapScript.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}&submodules=geocoder`;
        mapScript.async = true;
        document.head.appendChild(mapScript);
        
        mapScript.onload = () => {
          console.log('Naver Maps loaded');
          loadClusteringScript().then(resolve).catch(reject);
        };
        mapScript.onerror = reject;
      } else if (window.naver) {
        loadClusteringScript().then(resolve).catch(reject);
      }
    });
  }, [loadClusteringScript]);

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
        
        const validLocations = locations.filter(loc => loc.lat != null && loc.lng != null);
        console.log('Valid locations:', validLocations.length);

        if (validLocations.length === 0) {
          console.log('No valid locations to display');
          return;
        }

        const markers = validLocations.map(loc => {
            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(loc.lat, loc.lng),
                icon: {
                    content: `<div style="cursor:pointer; width:12px;height:12px;background-color:${getScoreColor(loc.score)};border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4);"></div>`,
                    anchor: new window.naver.maps.Point(6, 6),
                }
                // map 설정하지 않음 - 클러스터링에서 관리
            });

            // 마커에 클릭 이벤트 리스너 추가
            window.naver.maps.Event.addListener(marker, 'click', () => {
                onMarkerClickRef.current(loc.address);
            });

            return marker;
        });

        // 클러스터링 적용
        if (window.MarkerClustering) {
          console.log('Applying MarkerClustering');
          
          const clusterIcons = [
            {
              content: '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:12px;color:white;text-align:center;font-weight:bold;background-color:#10b981;border-radius:50%;opacity:0.9;"></div>',
              size: new window.naver.maps.Size(40, 40),
              anchor: new window.naver.maps.Point(20, 20)
            },
            {
              content: '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:12px;color:white;text-align:center;font-weight:bold;background-color:#f59e0b;border-radius:50%;opacity:0.9;"></div>',
              size: new window.naver.maps.Size(40, 40),
              anchor: new window.naver.maps.Point(20, 20)
            },
            {
              content: '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:12px;color:white;text-align:center;font-weight:bold;background-color:#ef4444;border-radius:50%;opacity:0.9;"></div>',
              size: new window.naver.maps.Size(40, 40),
              anchor: new window.naver.maps.Point(20, 20)
            }
          ];

          try {
            new window.MarkerClustering({
                minClusterSize: 2,
                maxZoom: 15,
                map: map,
                markers: markers,
                disableClickZoom: false,
                gridSize: 120,
                icons: clusterIcons,
                indexGenerator: [10, 50, 100],
                stylingFunction: (clusterMarker: NaverMarkerInstance, count: number) => {
                    const element = clusterMarker.getElement();
                    const firstDiv = element.querySelector('div:first-child');
                    if (firstDiv) {
                        firstDiv.textContent = String(count);
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
  }, []); // 의존성 배열을 빈 배열로 변경

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
