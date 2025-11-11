import type React from "react"
import type { Metadata } from "next"
import { Noto_Serif, Noto_Sans, Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import { ThemeProvider } from "@/components/theme-provider"
import { createMetadata, organizationSchema, webApplicationSchema } from "@/lib/seo-config"
import { DevModeBanner } from "@/components/dev-mode-banner"
import { SidebarProvider } from "@/lib/contexts/sidebar-context"
import "./globals.css"

// Display & Titles - Noto Serif
const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "600", "700", "900"],
})

// Headings (H1-H6) - Poppins
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

// Body Text & UI - Noto Sans
const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = createMetadata()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }} />
      </head>
      <body className={`${notoSans.variable} ${poppins.variable} ${notoSerif.variable} font-sans antialiased`}>
        <div className="flag-strip" aria-hidden="true" />
        <DevModeBanner />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </ThemeProvider>
        <Analytics />

        <Script
          id="helpscout-beacon-loader"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              !function(e,t,n){function a(){var e=t.getElementsByTagName("script")[0],n=t.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://beacon-v2.helpscout.net",e.parentNode.insertBefore(n,e)}if(e.Beacon=n=function(t,n,a){e.Beacon.readyQueue.push({method:t,options:n,data:a})},n.readyQueue=[],"complete"===t.readyState)return a();e.attachEvent?e.attachEvent("onload",a):e.addEventListener("load",a,!1)}(window,document,window.Beacon||function(){});
            `,
          }}
        />
        <Script
          id="helpscout-beacon-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `window.Beacon('init', '24b07133-7e39-4bfb-ac5c-71e8cd9fddb7')`,
          }}
        />
      </body>
    </html>
  )
}
