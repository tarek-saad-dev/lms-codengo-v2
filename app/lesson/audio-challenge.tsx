"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, AlertCircle, Loader2 } from "lucide-react";

type Props = {
  audioUrl: string;
  label: string;
  onComplete: () => void;
  disabled?: boolean;
};

export const AudioChallenge = ({ audioUrl, label, onComplete, disabled }: Props) => {
  const [hasPlayed, setHasPlayed] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = () => {
    setHasPlayed(true);
  };

  const handleError = () => {
    setAudioError(true);
    setIsLoading(false);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  if (!audioUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-lg text-center text-neutral-700">
          Audio link is missing.
        </p>
      </div>
    );
  }

  const encodedUrl = encodeURIComponent(audioUrl);
  const proxyUrl = `/api/media/gdrive?url=${encodedUrl}`;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-8">
      <div className="flex flex-col items-center gap-4 max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-4">
          <Volume2 className="w-8 h-8 text-green-500" />
          <h2 className="text-2xl font-bold text-neutral-700">{label}</h2>
        </div>

        {audioError ? (
          <div className="flex flex-col items-center gap-4 p-6 bg-red-50 rounded-lg border-2 border-red-200">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-center text-neutral-700">
              Failed to load audio. Make sure the Google Drive file is shared as &apos;Anyone with the link&apos;.
            </p>
          </div>
        ) : (
          <div className="w-full bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl border-2 border-green-200 shadow-lg">
            {isLoading && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
                <p className="text-lg font-medium text-green-700">
                  Loading your audio content...
                </p>
                <p className="text-sm text-green-600">
                  This may take a moment, please wait
                </p>
              </div>
            )}
            <audio
              ref={audioRef}
              controls
              preload="metadata"
              className={`w-full ${isLoading ? 'hidden' : 'block'}`}
              onPlay={handlePlay}
              onError={handleError}
              onLoadedData={handleLoadedData}
            >
              <source src={proxyUrl} type="audio/mpeg" />
              <source src={proxyUrl} type="audio/wav" />
              <source src={proxyUrl} type="audio/mp4" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <div className="mt-8 w-full max-w-md">
          <Button
            onClick={onComplete}
            disabled={!hasPlayed || disabled || audioError}
            className="w-full h-14 text-lg"
            variant={hasPlayed && !audioError ? "default" : "secondary"}
          >
            {hasPlayed && !audioError ? "Mark as Complete & Continue" : "Play audio to continue"}
          </Button>

          {!hasPlayed && !audioError && (
            <p className="text-sm text-center text-neutral-500 mt-3">
              Start playing the audio to enable the continue button
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
