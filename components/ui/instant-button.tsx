"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstantButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  onAsyncClick?: () => Promise<void>;
  variant?: "default" | "primary" | "primaryOutline" | "secondary" | "secondaryOutline" | "danger" | "dangerOutline" | "super" | "ghost" | "sidebar" | "sidebarOutline" | "locked";
  size?: "default" | "sm" | "lg" | "icon" | "rounded";
  enableSound?: boolean;
  enableVibration?: boolean;
  minLoadingDuration?: number;
  className?: string;
  disabled?: boolean;
}

export const InstantButton = ({
  children,
  onClick,
  onAsyncClick,
  variant = "default",
  size = "default",
  enableSound = false,
  enableVibration = false,
  minLoadingDuration = 300,
  className,
  disabled = false,
  ...props
}: InstantButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending] = useTransition();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTapSound = () => {
    if (!enableSound) return;

    if (!audioRef.current) {
      audioRef.current = new Audio("/tap.mp3");
      audioRef.current.volume = 0.5;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => { });
  };

  const triggerVibration = () => {
    if (!enableVibration) return;

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  const handlePointerDown = () => {
    if (disabled || isLoading || isPending) return;

    setIsPressed(true);
    playTapSound();
    triggerVibration();
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  const handlePointerLeave = () => {
    setIsPressed(false);
  };

  const handleClick = async () => {
    if (disabled || isLoading || isPending) return;

    const startTime = Date.now();
    setIsLoading(true);

    try {
      if (onAsyncClick) {
        await onAsyncClick();
      } else if (onClick) {
        const result = onClick();
        if (result instanceof Promise) {
          await result;
        }
      }

      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingDuration - elapsed);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    } catch (error) {
      console.error("InstantButton error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonLoading = isLoading || isPending;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "transition-all duration-75",
        isPressed && !isButtonLoading && "scale-95 brightness-90",
        isButtonLoading && "cursor-wait",
        className
      )}
      disabled={disabled || isButtonLoading}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      {...props}
    >
      {isButtonLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
};
