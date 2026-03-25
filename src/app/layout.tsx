import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import NotificationProvider from "@/components/NotificationProvider";
import PWAProvider from "@/components/PWAProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f5a623",
};

export const metadata: Metadata = {
  title: "天天向上 - 每日自律",
  description: "从清晨到夜晚，掌控你的每一天。帮助知识工作者建立规律作息和运动习惯。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "天天向上",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#16213e] text-[#f0f0f0]">
        <PWAProvider>
          <NotificationProvider>
            <main className="mx-auto max-w-md pb-20 pt-4 px-4">
              {children}
            </main>
            <BottomNav />
          </NotificationProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
