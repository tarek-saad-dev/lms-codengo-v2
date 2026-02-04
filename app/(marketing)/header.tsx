import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton
} from "@clerk/nextjs";
import { Loader2, LogIn } from "lucide-react";
export default function Header() {
  return (
    <header className=" lex items-center justify-between h-20 w-full border-b-2 border-slate-200 px-4">
      <div className="lg:max-w-screen-lg mx-auto flex items-center justify-between h-full">
        <div className="pt-8 pl-4 pb-7 flex items-center gap-x-2">
          <Link href="/">
            <Image src="/mascot.svg" alt="logo" width={40} height={40} />
          </Link>
          <h1 className="text-2xl font-bold text-green-600 tracking-wide">
            <Link href="/">codeingo</Link>
          </h1>
        </div>
        <ClerkLoading>
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </ClerkLoading>


        <ClerkLoaded>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton
              mode="modal"
              fallbackRedirectUrl="/learn"
            >
              <Button
                variant="ghost"
                size="lg"
                className="gap-x-2 flex items-center"
              >
                <span>Sign in</span>
                <LogIn className="w-5 h-5 text-muted-foreground" />
              </Button>
            </SignInButton>
          </SignedOut>
        </ClerkLoaded>
      </div>
    </header>
  );
}
