"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotebookText, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
    title: string;
    description: string;
};

export const UnitBanner = ({ title, description }: Props) => {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleContinue = () => {
        if (isNavigating) return;

        setIsNavigating(true);

        startTransition(() => {
            router.push("/lesson");
        });

        // Fallback timeout
        setTimeout(() => {
            if (isNavigating) {
                setIsNavigating(false);
                toast.error("Navigation failed. Please try again.");
            }
        }, 10000);
    };

    const handlePrefetch = () => {
        router.prefetch("/lesson");
    };

    return (
        <div className="w-full rounded-xl bg-green-500 p-5 text-white flex items-center justify-between">
            <div className="space-y-2.5">
                <h3 className="text-xl font-bold">
                    {title}
                </h3>
                <p className="text-md opacity-80">
                    {description}
                </p>
            </div>
            <Button
                size="lg"
                variant="secondary"
                className="hidden xl:flex border-2 border-b-4 active:border-b-2"
                onClick={handleContinue}
                onMouseEnter={handlePrefetch}
                disabled={isNavigating || isPending}
            >
                {isNavigating || isPending ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Loading...
                    </>
                ) : (
                    <>
                        <NotebookText className="mr-2" />
                        Continue
                    </>
                )}
            </Button>

        </div>

    );
};
