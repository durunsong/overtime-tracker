import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Poppins, Source_Serif_4 } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  applicationName: "Overtime Tracker",
  title: {
    default: "Overtime Tracker | 智能加班统计平台",
    template: "%s | Overtime Tracker",
  },
  description:
    "Overtime Tracker 帮助团队导入 Excel 打卡数据，自动计算每日加班、识别异常考勤，并生成可追溯的月度统计与 AI 总结。",
  keywords: ["加班统计", "考勤分析", "Excel导入", "月报生成", "AI总结", "Overtime Tracker"],
  authors: [{ name: "Overtime Tracker" }],
  creator: "Overtime Tracker",
  publisher: "Overtime Tracker",
  category: "productivity",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "Overtime Tracker",
    title: "Overtime Tracker | 智能加班统计平台",
    description:
      "导入 Excel 打卡数据，自动计算加班时长、定位异常记录，并生成月度统计与 AI 加班总结。",
  },
  twitter: {
    card: "summary",
    title: "Overtime Tracker | 智能加班统计平台",
    description: "Excel 打卡导入、加班自动计算、异常识别、月报导出与 AI 总结的一体化工作台。",
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${sourceSerif.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
