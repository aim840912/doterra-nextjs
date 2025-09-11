import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "doTERRA Taiwan - 純淨精油專家",
  description: "體驗世界最純淨的精油，創造更健康、更自然的生活方式。doTERRA 致力於提供最高品質的天然健康解決方案。",
  keywords: "doTERRA, 精油, 天然, 健康, 芳香療法, 植物萃取",
  authors: [{ name: "doTERRA Taiwan" }],
  creator: "doTERRA Taiwan",
  publisher: "doTERRA Taiwan",
  openGraph: {
    title: "doTERRA Taiwan - 純淨精油專家",
    description: "體驗世界最純淨的精油，創造更健康、更自然的生活方式。",
    type: "website",
    locale: "zh_TW",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
