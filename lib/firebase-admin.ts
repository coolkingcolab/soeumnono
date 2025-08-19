// /lib/firebase-admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

let app: App;

// 이미 초기화된 앱이 있으면 가져오고, 없으면 새로 초기화합니다.
if (getApps().length > 0) {
  app = getApps()[0];
} else {
  app = initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore(app);
const auth = getAuth(app);

// 다른 파일에서 사용할 수 있도록 db와 auth를 내보냅니다.
export { db, auth };
