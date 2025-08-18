// /components/AddressSearch.tsx
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddressSelect(inputValue.trim());
      setSuggestions([]);
    }
  };

  return (
    <form className="relative" ref={searchContainerRef} onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="건물, 아파트, 도로명주소로 검색"
          className="flex-grow w-full px-4 py-2 border border-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out placeholder-slate-700 text-slate-900"
        />
        <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out shadow-sm"
        >
            검색
        </button>
      </div>
      
      {(isLoading || suggestions.length > 0) && (
        // 테두리 색상(border-slate-300) 변경
        <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <li className="px-4 py-2 text-slate-500">검색 중...</li>
          ) : (
            suggestions.map((address, index) => (
              // hover 색상(hover:bg-slate-100) 및 텍스트 색상(text-slate-800) 변경
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
    </form>
  );
};

export default AddressSearch;
