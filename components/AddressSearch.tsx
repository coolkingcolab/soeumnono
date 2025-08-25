// /components/AddressSearch.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface AddressSearchProps {
  onAddressSelect: (address: string) => void;
}

const AddressSearch = ({ onAddressSelect }: AddressSearchProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 사용자가 2글자 이상 입력했을 때만 API 호출
    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce: 사용자가 입력을 멈추면 300ms 후에 API 호출
    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/address?keyword=${inputValue}`);
        const data = await response.json();
        if (data.addresses) {
          setSuggestions(data.addresses);
        }
      } catch (error) {
        console.error('Failed to fetch address suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  // 검색창 바깥을 클릭하면 추천 목록이 닫히도록 하는 기능
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 추천 주소를 클릭했을 때의 동작
  const handleSuggestionClick = (address: string) => {
    setInputValue(address);       // 선택한 주소로 입력창 업데이트
    onAddressSelect(address);     // 부모 컴포넌트에 선택된 주소 전달 (지도 이동)
    setSuggestions([]);           // 추천 목록 닫기
  };

  return (
    // form 태그를 div로 변경하여 엔터 키 제출 방지
    <div className="relative" ref={searchContainerRef}>
      <div className="flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="건물, 아파트, 도로명주소로 검색"
          className="flex-grow w-full px-4 py-2 border border-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out placeholder-slate-700 text-slate-900"
        />
        {/* 검색 버튼 제거 */}
      </div>
      
      {/* 로딩 중이거나 추천 주소가 있을 때 목록 표시 */}
      {(isLoading || suggestions.length > 0) && (
        <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <li className="px-4 py-2 text-slate-500">검색 중...</li>
          ) : (
            suggestions.map((address, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(address)}
                className="px-4 py-2 cursor-pointer text-slate-800 hover:bg-slate-100"
              >
                {address}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default AddressSearch;
