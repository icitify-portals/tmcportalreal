import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/session-provider";
import { getServerSession } from "@/lib/session"
import { SiteVisitor } from "@/components/analytics/site-visitor"
import { AiChatWidget } from "@/components/ai/ai-chat-widget"

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Muslim Congress - Membership Portal",
  description: "Enterprise membership and governance automation system",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession()
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased font-sans`}
      >
        <Providers session={session}>
          {children}
          <SiteVisitor />
          <AiChatWidget />
        </Providers>
      </body>
    </html>
  );
}
