import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { TabBar } from "@/components/TabBar";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Coy Discover",
  description: "Swipe, match, and keep your crushes private until it's mutual.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-white sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-[2.5rem] sm:shadow-card sm:ring-1 sm:ring-lav-deep/60">
          <main className="relative min-h-0 flex-1">{children}</main>
          <TabBar />
        </div>
      </body>
    </html>
  );
}
