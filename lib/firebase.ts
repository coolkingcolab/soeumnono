// /lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// --- 시작: 이 부분은 사용자의 Firebase 프로젝트 설정에 맞게 채워야 합니다. ---
// TODO: .env.local 파일에 아래와 같이 Firebase 관련 환경 변수를 추가하세요.
// NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
// NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
// NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your_measurement_id"
// --- 종료: 설정 영역 ---

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebase 앱 초기화 (서버사이드 렌더링 시 중복 초기화 방지)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;


export { app, auth, db, analytics };
