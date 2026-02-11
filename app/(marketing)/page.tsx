import { Button } from "@/components/ui/button";
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
import { LottiePlayer } from "@/components/lottie-player";

export default function Home() {
  return (
    <div className="max-w-[988px] w-full mx-auto px-4 flex flex-col items-center justify-center flex-1 lg:flex-row lg:gap-8">
      {/* Lottie Animation Container - Responsive sizing */}
      <div className="w-full max-w-[320px] h-[320px] sm:max-w-[400px] sm:h-[400px] md:max-w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] mb-6 lg:mb-0 flex items-center justify-center flex-shrink-0">
        <LottiePlayer
          src="https://lottie.host/922e09c2-2a0e-4520-910e-78e682bd6c54/hZ1XQMjZxE.lottie"
          width="100%"
          height="100%"
          autoplay
          loop
        />
      </div>

      {/* Content Container - Responsive text and buttons */}
      <div className="flex flex-col items-center gap-y-5 sm:gap-y-6 lg:gap-y-7 w-full lg:w-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-600 pb-2 sm:pb-3 lg:pb-4 max-w-[600px] text-center">
          <span className="bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">Your lectures</span>
          <br />
          <span className="text-primary">in <span className="font-medium">small</span>, <span className="font-medium">fun</span> steps</span>
        </h1>
        <ClerkLoading>
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </ClerkLoading>
        <ClerkLoaded>
          <SignedIn>
            <Button variant="secondary" size="lg" className="w-full max-w-[330px] sm:max-w-[380px]" asChild>
              <Link href="/learn">Continue learning path</Link>
            </Button>
          </SignedIn>
          <SignedOut>
            <SignUpButton
              mode="modal"
              signInFallbackRedirectUrl="/learn"
            >
              <Button variant="secondary" size="lg" className="w-full max-w-[330px] sm:max-w-[380px]">
                Get started
              </Button>
            </SignUpButton>
            <SignInButton
              mode="modal"
              fallbackRedirectUrl="/learn"
            >
              <Button variant="primaryOutline" size="lg" className="w-full max-w-[330px] sm:max-w-[380px]">
                Already have an account? Sign in
              </Button>
            </SignInButton>
          </SignedOut>
        </ClerkLoaded>
      </div>
    </div>
  );
}
