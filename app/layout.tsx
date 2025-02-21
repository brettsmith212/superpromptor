/**
 * @file Root layout for SuperPromptor
 * @description
 * This server-side layout component serves as the top-level wrapper for all pages
 * in the SuperPromptor application. It sets up the HTML structure, applies global
 * fonts, and renders child components.
 *
 * Key features:
 * - Configures Inter font
 * - Applies global CSS styles
 * - Provides a basic structure for navigation and content (to be expanded in Step 3)
 *
 * @dependencies
 * - next/font/google: For loading Inter font
 * - app/globals.css: Global styles applied here
 *
 * @notes
 * - Marked as "use server" per project rules for server components
 * - Minimal implementation now; navigation will be added in Step 3
 */


import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SuperPromptor",
  description: "A tool to streamline prompt creation for LLM chatboxes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} >
        {children}
      </body>
    </html>
  );
}