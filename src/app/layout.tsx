import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Ethara Tasks",
  description:
    "Secure multi-user task management foundation built with Next.js 16 and Prisma 7.",
};

const bodyClasses = [
  manrope.variable,
  ibmPlexMono.variable,
  "min-h-full",
  "bg-[linear-gradient(180deg,#f9fbff_0%,#eef4ff_100%)]",
  "text-slate-950",
].join(" ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={bodyClasses}>{children}</body>
    </html>
  );
}
