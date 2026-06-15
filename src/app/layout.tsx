import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import SuiProvider from "../providers/SuiProvider";
import { Toaster } from "sonner";

const spaceGrotesk = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600', '700'],
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
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <SuiProvider>
          {children}
        </SuiProvider>
        <Toaster richColors position="top-center" theme="dark" />
      </body>
    </html>
  );
}
