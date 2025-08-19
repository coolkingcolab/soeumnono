// /components/MapViewer.tsx
'use client';

import { useEffect, useRef } from 'react';
import { getReportLocations } from '@/lib/api';

// Naver Maps API 타입 정의 (클래스 생성자 타입으로 수정)
interface NaverMapInstance {
  setCenter: (latlng: NaverLatLngInstance) => void;
  setZoom: (zoom: number) => void;
  getBounds: () => any; // bounds 타입은 복잡하므로 any로 유지
}
type NaverLatLngInstance = object;
type NaverMarkerInstance = {
    getPosition: () => NaverLatLngInstance;
    getMap: () => NaverMapInstance | null;
    setMap: (map: NaverMapInstance | null) => void;
    getElement: () => HTMLElement;
};

type NaverMap = new (element: HTMLElement, options: { center: NaverLatLngInstance; zoom: number }) => NaverMapInstance;
type NaverLatLng = new (lat: number, lng: number) => NaverLatLngInstance;
type NaverMarker = new (options: any) => NaverMarkerInstance;
type NaverPoint = new (x: number, y: number) => any;
type NaverSize = new (w: number, h: number) => any;

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
          addListener: (map: NaverMapInstance, event: string, handler: (e?: any) => void) => void;
        };
        Service: NaverService;
      };
    };
    MarkerClustering: any; 
  }
}

interface MapViewerProps {
  selectedAddress: string | null;
}

const MapViewer = ({ selectedAddress }: MapViewerProps) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);

  const loadScripts = () => {
    return new Promise<void>((resolve, reject) => {
      if (document.getElementById('naver-maps-script')) {
        // 클러스터링 스크립트도 이미 로드되었는지 확인
        if (document.getElementById('marker-clustering-script')) {
          resolve();
          return;
        }
      }
      const mapScript = document.createElement('script');
      mapScript.id = 'naver-maps-script';
      mapScript.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}&submodules=geocoder`;
      mapScript.async = true;
      mapScript.defer = true;
      document.head.appendChild(mapScript);

      mapScript.onload = () => {
        const clusteringScript = document.createElement('script');
        clusteringScript.id = 'marker-clustering-script';
        clusteringScript.src = 'https://navermaps.github.io/maps.js/src/marker-clustering.js';
        clusteringScript.async = true;
        clusteringScript.defer = true;
        document.head.appendChild(clusteringScript);
        clusteringScript.onload = () => resolve();
        clusteringScript.onerror = (error) => reject(error);
      };
      mapScript.onerror = (error) => reject(error);
    });
  };

  const getScoreColor = (score: number) => {
    if (score < 2) return '#38bdf8'; // sky-400
    if (score < 3) return '#10b981'; // emerald-500
    if (score < 4) return '#f59e0b'; // amber-500
    if (score < 4.5) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
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
        if (!window.MarkerClustering || locations.length === 0) return;

        const markers = locations.map(loc => {
            return new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(loc.lat, loc.lng),
                icon: {
                    content: `<div style="width:12px;height:12px;background-color:${getScoreColor(loc.score)};border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4);"></div>`,
                    anchor: new window.naver.maps.Point(6, 6),
                }
            });
        });

        const clusterIcons = [
            { content: '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:12px;color:white;text-align:center;font-weight:bold;background-color:#10b981;border-radius:50%;opacity:0.9;"></div>' },
            { content: '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:12px;color:white;text-align:center;font-weight:bold;background-color:#f59e0b;border-radius:50%;opacity:0.9;"></div>' },
            { content: '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:12px;color:white;text-align:center;font-weight:bold;background-color:#ef4444;border-radius:50%;opacity:0.9;"></div>' },
        ].map(icon => ({ ...icon, size: new window.naver.maps.Size(40, 40), anchor: new window.naver.maps.Point(20, 20) }));

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
                const firstChild = element.querySelector('div:first-child');
                if (firstChild) {
                    firstChild.textContent = String(count);
                }
            }
        });
      });
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
