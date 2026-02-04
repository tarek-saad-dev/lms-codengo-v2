import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

type Props = {
    title: string;
}

export default function Header({ title}: Props) {
    return (
        <div className="sticky top-0 pb-3 lg:pt-[28px] lg:mt-[-28px] flex items-center justify-between bg-background z-3 border-b-2 border-border/50 mb-5 text-neutral-400 tracking-wide">
            <Link href="/courses">
                <Button variant="ghost" size="sm">
                    <ArrowLeftIcon className="h-5 w-5 stroke-2 text-neutral-400" />
                </Button>
            </Link>
            <h1 className="text-xl font-bold">{title}</h1>
            <div/>
        </div>
    )
}
