'use client'

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
type Props = {
    href: string
    label: string
    icon: string
}

export default function SidebarItem({href, label, icon}: Props) {
    const pathname = usePathname()
    const isActive = pathname === href
    return (
        <Button variant={isActive ? "sidebarOutline" : "sidebar"} className="justify-start w-full h-[52px]" asChild>
            <Link href={href}>
                <Image src={icon} alt={label} width={32} height={32} className="mr-5" />
                {label}
            </Link>
        </Button>
    )
}
