import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ExitModal } from "@/components/modals/exit.modal";
import { HeartsModal } from "@/components/modals/hearts-modal";
import { PracticeModal } from "@/components/modals/practice-modal";
import ClientProviders from "@/components/providers/ClientProviders";
import NextTopLoader from "nextjs-toploader";

const font = Nunito({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Codengo",
  description: "Codengo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={font.className}>
          <NextTopLoader
            color="#22c55e"
            height={3}
            showSpinner={false}
            speed={200}
            shadow="0 0 10px #22c55e,0 0 5px #22c55e"
          />
          <ClientProviders>
            <ExitModal />
            <HeartsModal />
            <PracticeModal />
            {children}
          </ClientProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
