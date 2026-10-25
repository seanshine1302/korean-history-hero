import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { GameSaveData, PlayerProfile } from '../types/game';

// Firebase configuration from user's project: korean-history-hero
const firebaseConfig = {
  apiKey: "AIzaSyD0eZTB9bj-zYLJqroL9D7PJf5uQod31CQ",
  authDomain: "korean-history-hero.firebaseapp.com",
  projectId: "korean-history-hero",
  storageBucket: "korean-history-hero.firebasestorage.app",
  messagingSenderId: "715058411344",
  appId: "1:715058411344:web:eb0d15fefab1a980641e55",
  measurementId: "G-8Y49T7BCPK"
};

// Initialize Firebase safely (avoid duplicate app initialization)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection names
const PROFILES_COLLECTION = 'traveler_profiles';

/**
 * Generate a friendly 6-character cloud sync code (e.g. "KOR-7821")
 */
export function generateFriendlySyncCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude confusing chars like 0/O, 1/I
  let result = 'KOR-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface CloudSyncResult {
  success: boolean;
  code?: string;
  message?: string;
  profile?: PlayerProfile;
}

/**
 * Save / Backup a traveler profile to Firebase Firestore with a sync code
 */
export async function uploadProfileToCloud(
  profile: PlayerProfile,
  existingCode?: string
): Promise<CloudSyncResult> {
  try {
    const code = (existingCode || generateFriendlySyncCode()).trim().toUpperCase();
    const docRef = doc(db, PROFILES_COLLECTION, code);

    const payload = {
      code,
      profile: JSON.parse(JSON.stringify(profile)),
      playerName: profile.name,
      updatedAt: serverTimestamp(),
      savedAtISO: new Date().toISOString()
    };

    await setDoc(docRef, payload, { merge: true });

    return {
      success: true,
      code,
      message: `클라우드 저장 완료! 코드: ${code}`
    };
  } catch (error: any) {
    console.error('Failed to upload profile to Firestore:', error);
    return {
      success: false,
      message: error?.message || '클라우드 저장 중 오류가 발생했습니다. 네트워크를 확인해주세요.'
    };
  }
}

/**
 * Download / Load a traveler profile from Firebase Firestore using the sync code
 */
export async function downloadProfileFromCloud(
  code: string
): Promise<CloudSyncResult> {
  try {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: '탐험 코드를 입력해주세요.' };
    }

    const docRef = doc(db, PROFILES_COLLECTION, cleanCode);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return {
        success: false,
        message: `코드 [${cleanCode}]에 해당하는 여행자 정보를 찾을 수 없습니다. 번호를 다시 확인해주세요!`
      };
    }

    const data = snap.data();
    const profile = data?.profile as PlayerProfile;

    if (!profile || !profile.name) {
      return {
        success: false,
        message: '클라우드 데이터 형식이 올바르지 않습니다.'
      };
    }

    return {
      success: true,
      code: cleanCode,
      profile,
      message: `'${profile.name}' 대원 정보를 성공적으로 불러왔습니다!`
    };
  } catch (error: any) {
    console.error('Failed to download profile from Firestore:', error);
    return {
      success: false,
      message: error?.message || '클라우드에서 불러오는 중 오류가 발생했습니다.'
    };
  }
}
