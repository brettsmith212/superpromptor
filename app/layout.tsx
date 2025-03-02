/**
 * @file Root layout for SuperPromptor
 * @description
 * This server-side layout component serves as the top-level wrapper for all pages
 * in the SuperPromptor application. It sets up the HTML structure, applies global
 * fonts, includes a horizontal navigation bar, and renders child components, 
 * fulfilling the layout requirements from the technical specification with a revised design.
 *
 * Key features:
 * - Configures Inter font (temporary; to be updated to Geist Sans/Mono)
 * - Applies global CSS styles from globals.css
 * - Includes a horizontal navigation bar at the top and main content area below
 *
 * @dependencies
 * - next/font/google: For loading Inter font
 * - app/globals.css: Global styles applied to the body
 * - app/styles/highlight.css: Styles for syntax highlighting in code blocks
 * - components/navigation-panel: Client-side navigation component included here
 *
 * @notes
 * - No "use server" directive needed; layouts are implicitly server components in Next.js
 * - Function is async to support potential future asynchronous operations
 * - Follows Technical Specification Section 6.2 layout structure, adapted for horizontal nav
 * - NavigationPanel is a client component, but Next.js handles its inclusion seamlessly
 * - Font update to Geist Sans/Mono is deferred to a future step pending proper setup
 * - Updated to use vertical flex layout to position nav bar above content
 */

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./styles/highlight.css"
import NavigationPanel from "@/components/navigation-panel"

const inter = Inter({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SuperPromptor",
  description: "A tool to streamline prompt creation for LLM chatboxes",
  icons: {
    icon: "/favicon.svg",
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* Horizontal navigation bar */}
          <NavigationPanel />

          {/* Main content area */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}