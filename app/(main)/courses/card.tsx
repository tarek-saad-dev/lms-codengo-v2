import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";

type props = {
  id: number;
  title: string;
  imageSrc: string;
  active: boolean;
  onClick: (id: number) => void;
  disabled: boolean;
  type: "GLOBAL" | "CUSTOMIZE";
  makerId?: string | null;
};

export default function Card({
  id,
  title,
  imageSrc,
  active,
  onClick,
  disabled,
  type,
}: props) {
  return (
    <div
      onClick={() => onClick(id)}
      className={cn(
        "h-full border-2 rounded-xl border-b-4 hover:bg-black/5 cursor-pointer active:border-b-2 flex flex-col items-center justify-between p-3 pb-6 min-h-[217px] min-w-[150px]",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <div className="min-h-[24px] w-full flex items-center justify-end">
        {active && (
          <div
            className="rounded-md bg-green-600 flex items-center 
      justify-center p-1.5"
          >
            <Check className="text-white stroke-[4] h-4 w-4" />
          </div>
        )}
      </div>
      <Image
  src={imageSrc}
  alt={title}
  height={70}
  width={93.33}
  className="rounded-lg drop-shadow-md border object-cover"
/>
<div className="text-center mt-3">
  <p className="text-neutral-700 font-bold">{title}</p>
  <div className="flex items-center justify-center gap-2 mt-1">
    <span className={cn(
      "text-xs px-2 py-0.5 rounded",
      type === "GLOBAL" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
    )}>
      {type === "GLOBAL" ? "Global" : "Custom"}
    </span>
  </div>
</div>

    </div>
  );
}
