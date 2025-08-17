// /components/AddressSearch.tsx
'use client';

import { useState, FormEvent } from 'react';

interface AddressSearchProps {
  onAddressSelect: (address: string) => void;
}

const AddressSearch = ({ onAddressSelect }: AddressSearchProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddressSelect(inputValue.trim());
    } else {
      alert('검색할 주소를 입력해주세요.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="예: 래미안아파트 101동"
        className="flex-grow w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
      />
      <button
        type="submit"
        className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out shadow-sm"
      >
        검색
      </button>
    </form>
  );
};

export default AddressSearch;
