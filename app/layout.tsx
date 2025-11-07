import type React from "react"
import type { Metadata } from "next"
import { Noto_Sans_JP } from "next/font/google"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "700"],
})

const fugazOne = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/fugaz-one/files/fugaz-one-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-fugaz-one",
  display: "swap",
})



export const metadata: Metadata = {
  title: "UsBest! - 共創型広告プラットフォーム",
  description: "視聴者がRemixして広告を共創し、報酬を得られる新しい広告体験",
  generator: "v0.app",
  icons: {
    icon: "/logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/vza3sdw.css" />
      </head>
      <body className={`${notoSansJP.variable} ${fugazOne.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
