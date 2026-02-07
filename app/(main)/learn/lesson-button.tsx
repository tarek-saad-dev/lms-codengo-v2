"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Star, Loader2 } from "lucide-react";
import { CircularProgressbarWithChildren } from "react-circular-progressbar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip } from "./components/ui/tooltip";
import { toast } from "sonner";
import "react-circular-progressbar/dist/styles.css";

type Props = {
  id: number;
  index: number;
  totalCount: number;
  locked?: boolean;
  current?: boolean;
  percentage: number;
  title?: string;
};

export const LessonButton = ({
  id,
  index,
  totalCount,
  locked,
  current,
  percentage,
  title,
}: Props) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const cycleLength = 8;

  const cycleIndex = index % cycleLength;

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

  const isFirst = index === 0;

  const isLast = index === totalCount;

  const isCompleted = !current && !locked;

  const Icon = isCompleted ? Check : isLast ? Crown : Star;

  const href = isCompleted ? `/lesson/${id}` : "/lesson";

  const handleClick = (e: React.MouseEvent) => {
    if (locked || isNavigating) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    setIsNavigating(true);

    startTransition(() => {
      router.push(href);
    });

    // Fallback timeout in case navigation fails
    setTimeout(() => {
      if (isNavigating) {
        setIsNavigating(false);
        toast.error("Navigation failed. Please try again.");
      }
    }, 10000);
  };

  const handlePrefetch = () => {
    if (!locked) {
      router.prefetch(href);
    }
  };

  return (
    <Tooltip
      side="right"
      sideOffset={10}
      content={
        <div className="p-4 bg-white rounded-xl shadow-lg min-w-[200px]">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold text-green-500">{title}</h3>
            <p className="text-gray-600">Lesson {index + 1} of {totalCount + 1}</p>
            {current && percentage > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                Progress: {percentage}%
              </div>
            )}
          </div>
        </div>
      }
    >
      <div
        onClick={handleClick}
        onMouseEnter={handlePrefetch}
        style={{ cursor: locked ? "not-allowed" : "pointer" }}
      >
        <div
          className="relative"
          style={{
            right: `${rightPosition}px`,
            marginTop: isFirst && !isCompleted ? 60 : 24,
          }}
        >
          {current ? (
            <div className="h-[102px] w-[102px] relative">
              <div className="absolute -top-6 left-2.5 px-3 py-2.5 border-2 font-bold uppercase text-green-500 bg-white rounded-xl animate-bounce tracking-wide z-10">
                Start
                <div className="absolute left-1/2 -bottom-2 w-0 h-0 border-x-8 border-x-transparent border-t-8 transform -translate-x-1/2" />
              </div>
              <CircularProgressbarWithChildren
                value={Number.isNaN(percentage) ? 0 : percentage}
                styles={{
                  path: {
                    stroke: "#4ade80", // Example green color
                  },
                  trail: {
                    stroke: "#E1E5E7", // Example light gray color
                  },
                }}
              >
                <Button
                  size="rounded"
                  variant={locked ? "locked" : "secondary"}
                  className="h-[70px] w-[70px] border-b-8"
                  disabled={isNavigating || isPending}
                >
                  {isNavigating || isPending ? (
                    <Loader2 className="h-10 w-10 animate-spin text-primary-foreground" />
                  ) : (
                    <Icon
                      className={cn(
                        "h-10 w-10",
                        locked
                          ? "fill-neutral-400 text-neutral-400 stroke-neutral-400"
                          : "fill-primary-foreground text-primary-foreground",
                      )}
                    />
                  )}
                </Button>
              </CircularProgressbarWithChildren>
            </div>
          ) : (
            <Button
              size="rounded"
              variant={locked ? "locked" : "secondary"}
              className="h-[70px] w-[70px] border-b-8"
              disabled={isNavigating || isPending}
            >
              {isNavigating || isPending ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary-foreground" />
              ) : (
                <Icon
                  className={cn(
                    "h-10 w-10",
                    locked
                      ? "fill-neutral-400 text-neutral-400 stroke-neutral-400"
                      : "fill-primary-foreground text-primary-foreground",
                    isCompleted && "fill-none stroke-[4]"
                  )}
                />
              )}
            </Button>
          )}
        </div>
      </div>
    </Tooltip>
  );
};
