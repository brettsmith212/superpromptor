/**
 * @file Root page for SuperPromptor
 * @description
 * This server-side page component serves as the entry point for the SuperPromptor
 * application's core functionality. It renders the ModeSelector component,
 * which handles the toggle between Template Prompt Editor and XML Code Parser.
 *
 * Key features:
 * - Renders the ModeSelector client component to enable mode switching
 *
 * @dependencies
 * - ./superpromptor/_components/mode-selector: Client component for mode selection
 *
 * @notes
 * - Marked as "use server" per project rules for server-side rendering
 * - No async data fetching required, so no Suspense wrapper needed
 * - Layout styling (e.g., padding) is handled by the root layout’s main element
 */
"use server"

import ModeSelector from "./superpromptor/_components/mode-selector"

export default async function Home() {
  return <ModeSelector />
}