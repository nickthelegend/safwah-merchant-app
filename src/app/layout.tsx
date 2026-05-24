import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import SuiProvider from "../providers/SuiProvider";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Safwah Merchant - Store VAT Portal",
  description: "Register store license, issue tax-free invoices directly to tourist apps, and track sales analytics on Sui blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className={nunito.className}>
        <SuiProvider>
          {children}
        </SuiProvider>
      </body>
    </html>
  );
}
