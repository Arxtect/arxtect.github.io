import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/components/app-context";
import { readdirSync } from "fs";
import { Toaster } from "@/components/ui/sonner";
import { getPublicBasePath } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StellarLatex — LaTeX in Your Browser",
  description:
    "Compile LaTeX documents instantly in the browser with StellarLatex. No installation required — powered by WebAssembly with full SyncTeX support.",
  icons: {
    icon: getPublicBasePath("/icon.svg"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppContextProvider value={{ exampleProjectPaths: readdirSync("./public/examples").map((f) => `/examples/${f}`) }}>
          {children}
        </AppContextProvider>
        <Toaster />
      </body>
    </html>
  );
}
