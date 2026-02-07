import { Loader2 } from "lucide-react";

export default function LessonDetailLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="w-16 h-16 text-green-500 animate-spin" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-neutral-700">
            Loading your lesson...
          </h2>
          <p className="text-neutral-500">
            Preparing your challenges
          </p>
        </div>
      </div>
    </div>
  );
}
