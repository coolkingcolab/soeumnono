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
  onMarkerClick: (address: string) => void; // 마커 클릭 핸들러 prop 추가
}

const MapViewer = ({ selectedAddress, onMarkerClick }: MapViewerProps) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);

  const loadScripts = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (document.getElementById('naver-maps-script') && document.getElementById('marker-clustering-script')) {
        resolve();
        return;
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
        clusteringScript.src = 'https://navermaps.github.io/maps.js/dist/marker-clustering.js';
        clusteringScript.async = true;
        clusteringScript.defer = true;
        document.head.appendChild(clusteringScript);
        clusteringScript.onload = () => resolve();
        clusteringScript.onerror = () => resolve();
      };
      mapScript.onerror = () => resolve();
    });
  }, []);

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
        if (!window.MarkerClustering || locations.length === 0) return;

        const markers = locations.map(loc => {
            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(loc.lat, loc.lng),
                icon: {
                    content: `<div style="cursor:pointer; width:12px;height:12px;background-color:${getScoreColor(loc.score)};border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4);"></div>`,
                    anchor: new window.naver.maps.Point(6, 6),
                }
            });

            // ==========================================================
            // 각 마커에 클릭 이벤트 리스너를 추가하는 코드
            // ==========================================================
            window.naver.maps.Event.addListener(marker, 'click', () => {
                onMarkerClick(loc.address);
            });
            // ==========================================================

            return marker;
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
  }, [loadScripts, onMarkerClick]);

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
