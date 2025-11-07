import type { Metadata } from "next";
import "./globals.css";
import { WdkProvider } from "@/contexts/WdkContext";

export const metadata: Metadata = {
  title: "OFFER-HUB - Freelance Platform on Avalanche",
  description: "Decentralized freelance platform built on Avalanche C-Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WdkProvider>
          {children}
        </WdkProvider>
      </body>
    </html>
  );
}

