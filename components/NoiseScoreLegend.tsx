// /components/NoiseScoreLegend.tsx
'use client';

const NoiseScoreLegend = () => {
  // AverageScoreBox와 동일한 색상 코드로 변경
  const legendItems = [
    { score: 1, color: 'bg-sky-500', label: '조용함' },
    { score: 2, color: 'bg-emerald-500', label: '약간의 소음' },
    { score: 3, color: 'bg-amber-500', label: '보통' },
    { score: 4, color: 'bg-orange-500', label: '시끄러움' },
    { score: 5, color: 'bg-red-600', label: '매우 심각' },
  ];

  return (
    <div className="bg-white bg-opacity-80 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-800 mb-2 text-center">소음 점수 범례</h4>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600">조용</span>
        <div className="flex rounded-full overflow-hidden border">
          {legendItems.map((item) => (
            <div
              key={item.score}
              className={`w-6 h-4 ${item.color}`}
              title={`${item.score}점: ${item.label}`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-600">심각</span>
      </div>
    </div>
  );
};

export default NoiseScoreLegend;
