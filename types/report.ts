// /types/report.ts

import { FieldValue, Timestamp } from 'firebase/firestore';

export interface Report {
  id?: string; // Firestore 문서 ID
  uid: string; // 평가를 남긴 사용자의 UID
  address: string; // 평가 대상 주소 (예: "00아파트 123동")
  score: number; // 1점에서 5점까지의 소음 점수
  noiseTypes: string[]; // 소음 종류 배열 (예: ["발걸음", "가구 끌기"])
  createdAt: FieldValue | Timestamp; // 평가 등록 시간
  lat?: number; // 위도
  lng?: number; // 경도
}
