import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PC Diagnostic Pro - Analisis Kerusakan Komputer Otomatis",
  description: "Aplikasi web untuk menganalisis, mendiagnosis, dan memberikan solusi penanganan masalah komputer Windows 10 & 11 yang tidak terlihat secara kasat mata.",
  keywords: ["PC Diagnostic", "Analisis Komputer", "Windows 10", "Windows 11", "Troubleshooting", "Diagnosa PC"],
  authors: [{ name: "PC Diagnostic Pro" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "PC Diagnostic Pro",
    description: "Analisis kerusakan komputer otomatis untuk Windows 10 & 11",
    siteName: "PC Diagnostic Pro",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
