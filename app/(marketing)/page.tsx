import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  ClerkLoading,
  ClerkLoaded,
  SignedIn,
  SignedOut,
  SignUpButton,
  SignInButton,
} from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import Link from "next/link";
export default function Home() {
  return (
    <div className="max-w-[988px] w-full mx-auto flex flex-col items-center justify-center flex-1 lg:flex-row gap-2">
      <div className="relative w-[240px] h-[240px] lg:w-[480px] lg:h-[480px] mb-8 lg:mb-0">
        <Image src="/hero.svg" alt="hero-image" fill />
      </div>
      <div className="flex flex-col items-center gap-y-7">
        <h1 className="text-xl lg:text-3xl font-bold text-neutral-600 pb-4 max-w-[480px] text-center">
          Learn, practice, and master programming with codeingo
        </h1>
          <ClerkLoading>
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          </ClerkLoading>
          <ClerkLoaded>
            <SignedIn>
              <Button variant="secondary" size="lg" className="w-10/12" asChild>
                <Link href="/learn">Continue learning path</Link>
              </Button>
            </SignedIn>
            <SignedOut>
              <SignUpButton
                mode="modal"
                signInFallbackRedirectUrl="/learn"
              >
                <Button variant="secondary" size="lg" className="w-10/12">
                  Get started
                </Button>
              </SignUpButton>
              <SignInButton
              mode="modal"
              fallbackRedirectUrl="/learn"
            >
                <Button variant="primaryOutline" size="lg" className="w-10/12">
                  Already have an account? Sign in
                </Button>
              </SignInButton>
            </SignedOut>
          </ClerkLoaded>
        </div>
      </div>
  );
}
