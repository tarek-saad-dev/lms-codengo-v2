import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

export const Tooltip = ({ content, children, side = "top", sideOffset = 8 }: TooltipProps) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div
        className={cn(
          "absolute hidden group-hover:block z-50",
          side === "top" && "left-1/2 -translate-x-1/2 bottom-full",
          side === "right" && "left-full top-1/2 -translate-y-1/2",
          side === "bottom" && "left-1/2 -translate-x-1/2 top-full",
          side === "left" && "right-full top-1/2 -translate-y-1/2"
        )}
        style={{
          margin: side === "top" ? `0 0 ${sideOffset}px 0` :
                 side === "right" ? `0 0 0 ${sideOffset}px` :
                 side === "bottom" ? `${sideOffset}px 0 0 0` :
                 `0 ${sideOffset}px 0 0`
        }}
      >
        {content}
      </div>
    </div>
  );
};
