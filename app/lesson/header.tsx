import { InfinityIcon, X } from "lucide-react";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { useExitModal } from "@/store/use-exit-modal";

type Props = {
  hearts: number;
  percentage: number;
  hasActiveSubscription: boolean;
  lessonNumber?: number;
  totalLessons?: number;
};

export const Header = ({
  hearts,
  percentage,
  hasActiveSubscription,
  lessonNumber,
  totalLessons,
}: Props) => {

  const { open } = useExitModal();

  return (
    <header className="lg:pt-[50px] pt-[20px] px-10 flex gap-x-7 items-center justify-between max-w-[1140px] mx-auto w-full">
      <X
        onClick={open}
        className="text-slate-500 hover:opacity-75 transition cursor-pointer"
      />
      <div className="flex-1 flex items-center gap-3">
        {lessonNumber && totalLessons && (
          <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-gray-500 whitespace-nowrap">
            <span className="text-gray-700">{lessonNumber}</span>
            <span>/</span>
            <span>{totalLessons}</span>
          </div>
        )}
        <Progress value={percentage} className="flex-1" />
      </div>
      <div className="text-rose-500 flex items-center font-bold">
        <Image
          src="/heart.svg"
          height={28}
          width={28}
          alt="Heart"
          className="mr-2"
        />
        {hasActiveSubscription ? (
          <InfinityIcon className="h-6 w-6 stroke-[3]" />
        ) : (
          hearts
        )}
      </div>
    </header>
  );
};
