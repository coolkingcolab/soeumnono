// /components/CoupangBanner.tsx
'use client';

const CoupangBanner = () => {
  return (
    <div className="w-full flex justify-center py-6 bg-white shadow-inner">
      <iframe
        src="/coupang.html"
        style={{
          width: "680px",
          height: "140px",
          border: "none",
        }}
      />
    </div>
  );
};

export default CoupangBanner;
