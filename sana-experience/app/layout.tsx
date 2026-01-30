import type { Metadata } from "next";
import { Cinzel, JetBrains_Mono } from "next/font/google"; // Hybrid fonts
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CinematicCursor from "@/components/CinematicCursor";

const cinzel = Cinzel({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Santhosh Narayanan | Proshow",
  description: "Immersive experience for SaNa at Yatra x RIT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${cinzel.variable} ${jetbrains.variable} antialiased bg-black text-white overflow-x-hidden`}
      >
        <SmoothScroll>
          <div className="crt-flicker"></div>
          <CinematicCursor />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
