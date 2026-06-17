import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LIMA",
  description: "Plataforma para gestionar hackatones academicos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
      )}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <ToastProvider>
          <AnchoredToastProvider>{children}</AnchoredToastProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
