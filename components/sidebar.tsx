import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import SidebarItem from "./sidebar-item";

import { ClerkLoading , ClerkLoaded , UserButton } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
type Props = {
  className?: string;
};

export default function Sidebar({ className }: Props) {
  return (
    <div
      className={cn(
        " h-full lg:w-[256px] lg:fixed top-0 left-0 px-4 border-r-2 flex flex-col",
        className
      )}
    >
      <div className="pt-8 pl-4 pb-7 flex items-center gap-x-2">
        <Link href="/">
          <Image src="/mascot.svg" alt="logo" width={40} height={40} />
        </Link>
        <h1 className="text-2xl font-bold text-green-600 tracking-wide">
          <Link href="/">codeingo</Link>
        </h1>
      </div>
      <div className="flex flex-col gap-y-2 flex-1">
        <SidebarItem label="learn" href="/learn" icon='/learn.svg' />
        <SidebarItem label="leaderboard" href="/leaderboard" icon='/leaderboard.svg' />
        <SidebarItem label="shop" href="/shop" icon='/shop.svg' />
        <SidebarItem label="profile" href="/profile" icon='/profile.svg' />
      </div>
      <div className="p-4">
        <ClerkLoading>
            <Loader2 className="animate-spin" />
        </ClerkLoading>
        <ClerkLoaded>
            <UserButton afterSignOutUrl="/" appearance={{
                elements: {
                    avatarBox: "h-10 w-10",
                    userButtonPopoverCard: "w-[225px] shadow-md border-2 border-green-600/10 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:border-green-600/20",
                },
            }} />
        </ClerkLoaded>
      </div>
    </div>
  );
}
