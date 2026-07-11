import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { branding } from "@/config/branding";

/*
 * Atkinson Hyperlegible wurde vom Braille Institute für maximale
 * Lesbarkeit bei eingeschränktem Sehvermögen entwickelt – passend
 * zur Zielgruppe der Patientenoberfläche.
 */
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: branding.appName,
    template: `%s – ${branding.appName}`,
  },
  description: branding.appDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={cn("h-full antialiased font-sans", atkinson.variable)}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
