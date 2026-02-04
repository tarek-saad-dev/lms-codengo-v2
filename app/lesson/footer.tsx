import { useKey, useMedia } from "react-use";
import { CheckCircle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  onCheck: () => void;
  status: "correct" | "wrong" | "none" | "completed";
  disabled?: boolean;
  lessonId?: number;
  explanation?: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Footer = ({ onCheck, status, disabled, lessonId, explanation }: Props) => {
  useKey("Enter", onCheck, {}, [onCheck]);
  const isMobile = useMedia("(max-width: 1024px)", false);

  return (
    <footer
      className={cn(
        "lg:h-[140px] relative h-[100px] mt-[45px] border-t-2",
        status === "correct" && "border-transparent bg-green-100",
        status === "wrong" && "border-transparent bg-rose-100"
      )}
    >
      <div className="max-w-[1140px] h-full mx-auto flex items-center justify-between px-6 lg:px-10">
        <div>
          {status === "correct" && (
            <div className="flex flex-col gap-2">
              <div className="text-green-500 font-bold text-base lg:text-2xl flex items-center">
                <CheckCircle className="h-6 w-6 lg:h-10 lg:w-10 mr-4" />
                Nicely done!
              </div>

              {explanation && (
                <div className="text-gray-600 text-xs sm:text-sm lg:text-base p-4 sm:p-2 font-bold leading-relaxed text-justify text-green-800 fixed lg:relative bottom-0 left-0 w-full bg-green-100 lg:bg-transparent lg:w-auto">
                  {explanation}
                </div>
              )}

            </div>
          )}
          {status === "wrong" && (
            <div className="text-rose-500 font-bold text-base lg:text-2xl flex items-center">
              <XCircle className="h-6 w-6 lg:h-10 lg:w-10 mr-4" />
              Try again.
            </div>
          )}
          {status === "completed" && (
            <Button
              variant="default"
              size={isMobile ? "sm" : "lg"} 
              onClick={() => { window.location.href = `/lesson/${lessonId}`; }}
            >
              Practice again
            </Button>
          )}
        </div>

        <Button
          disabled={disabled}
          className="w-auto"
          onClick={onCheck}
          size={isMobile ? "sm" : "lg"} 
          variant={status === "wrong" ? "danger" : "secondary"} 
        >
          {status === "none" && "Check"}
          {status === "correct" && "Next"}
          {status === "wrong" && "Retry"}
          {status === "completed" && "Continue"}
        </Button>
      </div>
    </footer>
  );
};
