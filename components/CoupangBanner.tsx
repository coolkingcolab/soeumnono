// /components/CoupangBanner.tsx
'use client';

import { useEffect, useState } from 'react';

const CoupangBanner = () => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const containerWidth = document.getElementById("coupang-wrapper")?.offsetWidth || 680;
      const newScale = Math.min(containerWidth / 680, 1); 
      setScale(newScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div id="coupang-wrapper" className="p-4 bg-white rounded-lg shadow flex justify-center w-full">
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${680 * scale}px`,
          height: `${140 * scale}px`,
          overflow: "hidden",
        }}
      >
        <iframe
          src="/coupang.html"
          style={{
            width: "680px",
            height: "140px",
            border: "none",
          }}
        />
      </div>
    </div>
  );
};

export default CoupangBanner;
