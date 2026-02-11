export const LearnPageSkeleton = () => {
  return (
    <div className="flex flex-row-reverse gap-[48px] px-6 animate-pulse">
      {/* Sticky Sidebar Skeleton */}
      <div className="hidden lg:block w-[368px] sticky top-6 self-start">
        <div className="min-h-[calc(100vh-48px)] lg:min-h-[calc(100vh-80px)] flex flex-col gap-4 border-2 rounded-xl p-6 bg-white">
          {/* User Progress Skeleton */}
          <div className="flex items-center justify-between gap-2">
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
            <div className="h-10 w-24 bg-gray-200 rounded"></div>
          </div>
          
          {/* Hearts Skeleton */}
          <div className="flex items-center gap-2 pb-4 mb-4 border-b-2">
            <div className="h-10 w-10 bg-red-200 rounded-full"></div>
            <div className="h-6 w-20 bg-gray-200 rounded"></div>
          </div>
          
          {/* Points Skeleton */}
          <div className="flex items-center gap-2 pb-4">
            <div className="h-10 w-10 bg-yellow-200 rounded-full"></div>
            <div className="h-6 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1">
        {/* Header Skeleton */}
        <div className="sticky top-0 bg-white pb-3 mb-5 z-10">
          <div className="h-10 w-64 bg-gray-200 rounded"></div>
        </div>

        {/* Units Skeleton */}
        {[1, 2, 3].map((unit) => (
          <div key={unit} className="mb-10">
            {/* Unit Banner Skeleton */}
            <div className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 p-5 flex items-center justify-between mb-6">
              <div className="space-y-2.5">
                <div className="h-8 w-48 bg-white/20 rounded"></div>
                <div className="h-4 w-64 bg-white/20 rounded"></div>
              </div>
              <div className="h-16 w-16 bg-white/20 rounded-full"></div>
            </div>

            {/* Lessons Path Skeleton */}
            <div className="relative">
              {/* Lesson Buttons Skeleton */}
              {[1, 2, 3, 4, 5, 6].map((lesson, index) => {
                const cycleIndex = index % 8;
                let indentationLevel;
                
                if (cycleIndex <= 2) {
                  indentationLevel = cycleIndex;
                } else if (cycleIndex <= 4) {
                  indentationLevel = 4 - cycleIndex;
                } else if (cycleIndex <= 6) {
                  indentationLevel = 4 - cycleIndex;
                } else {
                  indentationLevel = cycleIndex - 8;
                }
                
                const rightPosition = indentationLevel * 40;
                
                return (
                  <div
                    key={lesson}
                    className="relative"
                    style={{
                      right: `${rightPosition}px`,
                      marginTop: index === 0 ? 60 : 24,
                    }}
                  >
                    {index === 0 && (
                      <div className="h-[102px] w-[102px] relative">
                        {/* Progress Circle Skeleton */}
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                        <div className="absolute inset-[16px] h-[70px] w-[70px] bg-gray-200 rounded-full"></div>
                      </div>
                    )}
                    {index !== 0 && (
                      <div className="h-[70px] w-[70px] bg-gray-200 rounded-full border-b-8 border-gray-300"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
