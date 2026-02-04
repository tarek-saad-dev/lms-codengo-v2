"use client";

import { useState } from "react";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoProps {
  content: string;
  onComplete: () => void;
}

export const VideoChallenge = ({ content, onComplete }: VideoProps) => {
  const [videoWatched, setVideoWatched] = useState(false);

  const handleVideoEnd = () => {
    setVideoWatched(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-6 bg-slate-50">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Video Lesson</h2>
            <p className="text-sm text-muted-foreground">
              Watch the video to continue with your lesson
            </p>
          </div>
          <div className="flex items-center gap-x-2">
            <div
              className={cn(
                "flex items-center gap-x-2 px-3 py-1 rounded-full text-sm",
                videoWatched
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-700"
              )}
            >
              {videoWatched ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>In Progress</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/5 shadow-lg ring-1 ring-black/10">
          <ReactPlayer
            url={content}
            width="100%"
            height="100%"
            controls
            onEnded={handleVideoEnd}
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                },
              },
            }}
          />
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onComplete}
            disabled={!videoWatched}
            size="lg"
            variant={videoWatched ? "primary" : "default"}
            className={cn(
              "min-w-[200px] transition-all duration-200",
              videoWatched && "animate-pulse"
            )}
          >
            {videoWatched ? "Continue" : "Watch to Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};
