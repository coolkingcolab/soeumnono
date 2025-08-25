// /components/AuthButton.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
// import PhoneAuthModal from './PhoneAuthModal'; // 전화번호 로그인을 다시 사용할 때 주석 해제

const AuthButton = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false); // 전화번호 로그인을 다시 사용할 때 주석 해제

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
              <Image
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm font-medium hidden sm:block text-slate-900">
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
            {/* 전화번호 로그인을 다시 사용할 때 아래 버튼 주석 해제 */}
            {/*
            <button
              onClick={() => setIsPhoneModalOpen(true)}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-800 transition-colors"
            >
              전화번호 로그인
            </button>
            */}
          </div>
        )}
      </div>
      {/* 전화번호 로그인을 다시 사용할 때 아래 모달 주석 해제 */}
      {/*
      <PhoneAuthModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
      />
      */}
    </>
  );
};

export default AuthButton;
