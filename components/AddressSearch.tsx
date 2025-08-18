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
    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      return;
    }

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

  const handleSuggestionClick = (address: string) => {
    setInputValue(address);
    onAddressSelect(address);
    setSuggestions([]);
  };

  return (
    <div className="relative" ref={searchContainerRef}>
      <div className="flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="건물, 아파트, 도로명주소로 검색"
          // text-slate-900 클래스를 추가하여 입력 텍스트 색상을 진하게 변경
          className="flex-grow w-full px-4 py-2 border border-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out placeholder-slate-700 text-slate-900"
        />
      </div>
      
      {(isLoading || suggestions.length > 0) && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <li className="px-4 py-2 text-slate-500">검색 중...</li>
          ) : (
            suggestions.map((address, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(address)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
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
