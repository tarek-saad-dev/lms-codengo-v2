export const ChallengeSkeleton = () => {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Header skeleton */}
      <div className="h-[100px] bg-gradient-to-b from-green-500 to-green-600 px-6 lg:px-10 flex items-center justify-between">
        <div className="h-8 w-32 bg-white/20 rounded"></div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-24 bg-white/20 rounded"></div>
          <div className="h-10 w-10 bg-white/20 rounded-full"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-6">
          {/* Title skeleton */}
          <div className="h-8 w-3/4 bg-gray-200 rounded mx-auto"></div>
          
          {/* Main content area */}
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            {/* Media placeholder */}
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto"></div>
                <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
              </div>
            </div>
            
            {/* Options skeleton */}
            <div className="space-y-3">
              <div className="h-16 bg-gray-100 rounded-lg"></div>
              <div className="h-16 bg-gray-100 rounded-lg"></div>
              <div className="h-16 bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="h-[140px] border-t-2 border-gray-200 px-6 lg:px-10 flex items-center justify-between">
        <div className="h-10 w-40 bg-gray-200 rounded"></div>
        <div className="h-12 w-32 bg-green-500/20 rounded"></div>
      </div>
    </div>
  );
};
