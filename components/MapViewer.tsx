'use client';

import { useEffect, useRef } from 'react';

// Naver Maps API 타입 정의
interface NaverMapInstance {
  setCenter: (latlng: NaverLatLngInstance) => void;
  setZoom: (zoom: number) => void;
}
type NaverLatLngInstance = object;
type NaverMarkerInstance = object;

type NaverMap = new (
  element: HTMLElement,
  options: { center: NaverLatLngInstance; zoom: number }
) => NaverMapInstance;
type NaverLatLng = new (lat: number, lng: number) => NaverLatLngInstance;
type NaverMarker = new (options: {
  position: NaverLatLngInstance;
  map: NaverMapInstance;
}) => NaverMarkerInstance;

interface NaverService {
  reverseGeocode: (
    options: { coords: NaverLatLngInstance; orders: string },
    callback: (status: number, response: ReverseGeocodeResponse) => void
  ) => void;
  geocode: (
    options: { query: string },
    callback: (status: number, response: GeocodeResponse) => void
  ) => void;
  OrderType: { ADDR: string; ROAD_ADDR: string };
  Status: { OK: number };
}
interface ReverseGeocodeResponse {
  v2: {
    address: { roadAddress: string };
    results: { land: { name: string } }[];
  };
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
        Event: {
          addListener: (
            map: NaverMapInstance,
            event: string,
            handler: (e: { coord: NaverLatLngInstance }) => void
          ) => void;
        };
        Service: NaverService;
      };
    }
  }
}

interface MapViewerProps {
  selectedAddress: string | null;
  onMapClick: (address: string) => void;
}

const MapViewer = ({ selectedAddress, onMapClick }: MapViewerProps) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);

  const loadNaverMapsScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (document.getElementById('naver-maps-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'naver-maps-script';
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}&submodules=geocoder`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
    });
  };

  useEffect(() => {
    loadNaverMapsScript()
      .then(() => {
        if (!mapElement.current || !window.naver) return;

        const mapOptions = {
          center: new window.naver.maps.LatLng(37.5665, 126.9780),
          zoom: 16,
        };

        const map = new window.naver.maps.Map(mapElement.current, mapOptions);
        mapRef.current = map;

        window.naver.maps.Event.addListener(map, 'click', (e) => {
          const latlng = e.coord;

          window.naver.maps.Service.reverseGeocode(
            {
              coords: latlng,
              orders: [
                window.naver.maps.Service.OrderType.ADDR,
                window.naver.maps.Service.OrderType.ROAD_ADDR,
              ].join(','),
            },
            (status, response) => {
              if (status !== window.naver.maps.Service.Status.OK) {
                return alert('주소를 찾는 데 실패했습니다.');
              }

              const result = response.v2;
              const roadAddress = result.address.roadAddress;
              const buildingName = result.results[0]?.land?.name || '';
              const finalAddress = buildingName
                ? `${roadAddress} ${buildingName}`
                : roadAddress;

              if (finalAddress) {
                onMapClick(finalAddress);
              }
            }
          );
        });
      })
      .catch(console.error);
  }, [onMapClick]);

  useEffect(() => {
    if (selectedAddress && mapRef.current && window.naver) {
      window.naver.maps.Service.geocode(
        {
          query: selectedAddress,
        },
        (status, response) => {
          if (status !== window.naver.maps.Service.Status.OK) {
            return;
          }

          const result = response.v2.addresses[0];
          if (result) {
            const point = new window.naver.maps.LatLng(
              Number(result.y),
              Number(result.x)
            );

            mapRef.current!.setCenter(point);
            mapRef.current!.setZoom(17);

            new window.naver.maps.Marker({
              position: point,
              map: mapRef.current!, // ✅ null 아님을 단언
            });
          }
        }
      );
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
