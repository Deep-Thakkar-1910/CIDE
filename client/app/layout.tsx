import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CIDE",
    template: "%s | CIDE",
  },
  description:
    "CIDE is a collaborative IDE made for teams to have fun with pair programming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <Toaster
            richColors={false}
            duration={5000}
            position="bottom-right"
            closeButton
            swipeDirections={["left", "right"]}
            visibleToasts={3}
          />
        </Providers>
      </body>
    </html>
  );
}
