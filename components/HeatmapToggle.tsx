// /components/HeatmapToggle.tsx
'use client';

import { useState } from 'react';

// TODO: onToggle prop을 추가하여 부모 컴포넌트(MapViewer)에 상태 변경을 알리도록 확장해야 합니다.
interface HeatmapToggleProps {
  onToggle?: (isToggled: boolean) => void;
}

const HeatmapToggle = ({ onToggle }: HeatmapToggleProps) => {
  const [isToggled, setIsToggled] = useState(false);

  const handleToggle = () => {
    const newState = !isToggled;
    setIsToggled(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">히트맵</span>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isToggled ? 'bg-blue-600' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={isToggled}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isToggled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default HeatmapToggle;
