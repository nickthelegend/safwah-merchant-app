import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { OnchainProvider } from "@/components/OnchainProvider";
import { SafwahDataProvider } from "@/components/DataProvider";

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

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SAFWAH Merchant — Accept crypto, settle in Dirhams",
  description: "The SAFWAH merchant console: accept crypto payments, settle instantly in AED, withdraw to your UAE bank, and track revenue & VAT. Built on Polygon.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable} ${hanken.variable}`}>
      <body style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <OnchainProvider>
          <SafwahDataProvider>
            <div className="shell">
              <Sidebar />
              <div className="main">{children}</div>
            </div>
          </SafwahDataProvider>
        </OnchainProvider>
        <Toaster richColors position="top-center" theme="light" />
      </body>
    </html>
  );
}
