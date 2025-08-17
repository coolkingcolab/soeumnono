// /components/AuthButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import PhoneAuthModal from './PhoneAuthModal'; // 새로 만들 모달 컴포넌트 임포트

const AuthButton = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false); // 전화번호 모달 상태

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
    } catch (error) {
      console.error('Google Sign-in error:', error);
      alert('로그인에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (error) {
      console.error('Sign-out error:', error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  if (isLoading) {
    return <div className="w-24 h-9 bg-gray-200 rounded-md animate-pulse"></div>;
  }

  return (
    <>
      <div>
        {currentUser ? (
          <div className="flex items-center gap-3">
            {currentUser.photoURL && (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm font-medium hidden sm:block">
              {currentUser.displayName || currentUser.phoneNumber}
            </span>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoogleSignIn}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Google 로그인
            </button>
            <button
              onClick={() => setIsPhoneModalOpen(true)} // 전화번호 모달 열기
              className="px-3 py-1.5 text-sm font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-800 transition-colors"
            >
              전화번호 로그인
            </button>
          </div>
        )}
      </div>
      {/* 전화번호 인증 모달 */}
      <PhoneAuthModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
      />
    </>
  );
};

export default AuthButton;
