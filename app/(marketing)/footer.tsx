import { Button } from "@/components/ui/button";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="hidden lg:block h-20 w-full border-t-2 border-slate-200 p-2">
      <div className="max-w-screen-lg mx-auto flex items-center justify-evenly h-full">
        <Button variant="ghost" size="lg" className="w-full">
          <Image src="/reactg.gif" alt="logo" width={65} height={65} className="rounded-full mr-4" />
          <span className="text-sm font-medium">React</span>
        </Button>
        <Button variant="ghost" size="lg" className="w-full">
          <Image src="/flutterg.gif" alt="logo" width={65} height={65} className="rounded-full mr-4" />
          <span className="text-sm font-medium">Flutter</span>
        </Button>
        <Button variant="none" size="lg" className="w-full">
          <Image src="/mascot.svg" alt="logo" width={55} height={55} className="mx-4" />
        </Button>
        <Button variant="ghost" size="lg" className="w-full">
          <Image src="/nextjs.gif" alt="logo" width={70} height={65} className="rounded-full mr-4" />
          <span className="text-sm font-medium">Next.js</span>
        </Button>
        <Button variant="ghost" size="lg" className="w-full">
          <Image src="/js.gif" alt="logo" width={70} height={65} className="rounded-full mr-4" />
          <span className="text-sm font-medium">JavaScript</span>
        </Button>
        

      </div>
    </footer>
  );
};

export default Footer;
