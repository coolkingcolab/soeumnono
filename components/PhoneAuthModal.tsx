// /components/PhoneAuthModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
    grecaptcha: {
      reset: (widgetId: number) => void;
    };
  }
}

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PhoneAuthModal = ({ isOpen, onClose }: PhoneAuthModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'inputPhone' | 'inputCode'>('inputPhone');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {},
        });
        window.recaptchaVerifier.render();
      } catch (error) {
        console.error("reCAPTCHA 렌더링 오류:", error);
        setErrorMessage("reCAPTCHA를 로드하는 데 실패했습니다. 페이지를 새로고침 해주세요.");
      }
    }
  }, [isOpen]);

  const handleSendCode = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const formattedPhoneNumber = '+82' + phoneNumber.substring(1);

    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      setStep('inputCode');
    } catch (error) {
      console.error('SMS 전송 오류:', error);
      setErrorMessage('인증번호 전송에 실패했습니다. 전화번호를 확인하거나 잠시 후 다시 시도해주세요.');
      window.recaptchaVerifier.render().then((widgetId) => {
        // @ts-ignore를 @ts-expect-error로 수정
        // @ts-expect-error - grecaptcha is loaded from an external script and is not available in the global scope during compilation.
        window.grecaptcha.reset(widgetId);
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await window.confirmationResult.confirm(verificationCode);
      const user = result.user;
      const idToken = await user.getIdToken();

      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      onClose();
    } catch (error) {
      console.error('코드 인증 오류:', error);
      setErrorMessage('인증 코드가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-bold mb-4 text-center">전화번호로 로그인</h2>
        
        {step === 'inputPhone' && (
          <div className="space-y-4">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="전화번호 입력 ('-' 제외)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendCode}
              disabled={isLoading || phoneNumber.length < 10}
              className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? '전송 중...' : '인증번호 받기'}
            </button>
          </div>
        )}

        {step === 'inputCode' && (
          <div className="space-y-4">
            <p className="text-sm text-center text-gray-600">{phoneNumber}로 전송된 인증번호를 입력하세요.</p>
            <input
              type="number"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="인증번호 6자리"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleVerifyCode}
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? '인증 중...' : '로그인'}
            </button>
            <button onClick={() => setStep('inputPhone')} className="text-sm text-center w-full text-gray-500 hover:underline">
              전화번호 다시 입력하기
            </button>
          </div>
        )}

        {errorMessage && <p className="text-red-500 text-sm mt-4 text-center">{errorMessage}</p>}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default PhoneAuthModal;
