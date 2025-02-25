"use client"

/**
 * @file Navigation panel component for SuperPromptor
 * @description
 * This client-side component renders a horizontal navigation bar for the SuperPromptor
 * application. It displays the app name "SuperPromptor" linking to the root page '/' on the left
 * and a link to "How To Use" on the right, fulfilling the navigation requirements with a revised design.
 *
 * Key features:
 * - Displays "SuperPromptor" as a bold link to '/' on the left
 * - Provides an underlined "How To Use" link on the right
 * - Uses Tailwind CSS for horizontal layout, responsive design, and dark mode support
 *
 * @dependencies
 * - next/link: For client-side routing between pages
 *
 * @notes
 * - Marked as "use client" per project rules for client-side routing
 * - Placed in /components/ as a shared component used by the root layout
 * - Styling aligns with Technical Specification Section 6.1 (color palette, typography)
 * - Horizontal design replaces the original vertical sidebar per user feedback
 * - Hover effects enhance UX; underline on "How To Use" is static as requested
 */

import Link from "next/link"

export default function NavigationPanel() {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4">
      {/* Horizontal navigation container */}
      <nav className="flex justify-between items-center">
        {/* Left side: App name */}
        <Link
          href="/"
          className="text-xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-500 dark:hover:text-blue-400"
        >
          SuperPromptor
        </Link>

        {/* Right side: How To Use link */}
        <Link
          href="/how-to-use"
          className="text-gray-700 dark:text-gray-300 underline hover:text-blue-500 dark:hover:text-blue-400"
        >
          How To Use
        </Link>
      </nav>
    </div>
  )
}