import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Nav } from "@/components/Nav";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "SAFWAH Merchant — Accept crypto, settle in Dirhams",
  description: "The SAFWAH merchant console: accept crypto payments, settle instantly in AED, withdraw to your UAE bank, and track revenue & VAT. Built on Polygon.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body style={{ background: "var(--bg)", minHeight: "100vh" }} className="bg-grid">
        <Nav />
        {children}
        <Toaster richColors position="top-center" theme="dark" />
      </body>
    </html>
  );
}
