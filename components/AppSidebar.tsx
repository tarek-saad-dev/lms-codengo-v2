"use client";

import { cn } from "@/lib/utils";
import { Book, Gift, Home, Trophy, User } from "lucide-react";
import Link from "next/link";

interface AppSidebarProps {
  activePath: string;
}

const sidebarItems = [
  {
    icon: Home,
    label: "Home",
    href: "/",
  },
  {
    icon: Book,
    label: "Learn",
    href: "/learn",
  },
  {
    icon: Trophy,
    label: "Leaderboard",
    href: "/leaderboard",
  },
  {
    icon: Gift,
    label: "Shop",
    href: "/shop",
  },
  {
    icon: User,
    label: "Profile",
    href: "/profile",
  },
];

export const AppSidebar = ({ activePath }: AppSidebarProps) => {
  return (
    <div className="flex flex-col w-[80px] bg-white border-r border-gray-200">
      {sidebarItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center h-[80px] gap-1 hover:bg-app-gray-light transition-colors",
            activePath === item.href && "bg-app-gray-light"
          )}
        >
          <item.icon
            size={24}
            className={cn(
              "text-gray-500",
              activePath === item.href && "text-app-blue"
            )}
          />
          <span
            className={cn(
              "text-xs font-medium text-gray-500",
              activePath === item.href && "text-app-blue"
            )}
          >
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
};
