import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ExitModal } from "@/components/modals/exit.modal";
import { HeartsModal } from "@/components/modals/hearts-modal";
import { PracticeModal } from "@/components/modals/practice-modal";
import ClientProviders from "@/components/providers/ClientProviders";

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
