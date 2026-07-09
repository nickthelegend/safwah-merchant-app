import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Nav } from "@/components/Nav";
import { OnchainProvider } from "@/components/OnchainProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "SAFWAH Merchant — Accept crypto, settle in Dirhams",
  description: "The SAFWAH merchant console: accept crypto payments, settle instantly in AED, withdraw to your UAE bank, and track revenue & VAT. Built on Polygon.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <OnchainProvider>
          <Nav />
          {children}
        </OnchainProvider>
        <Toaster richColors position="top-center" theme="light" />
      </body>
    </html>
  );
}
