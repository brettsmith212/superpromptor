"use server"

/**
 * @file SuperPromptor main page
 * @description
 * This server-side page component serves as the entry point for the SuperPromptor
 * application's core functionality. It renders the TemplateDisplay component,
 * which handles template upload and display.
 *
 * Key features:
 * - Renders the TemplateDisplay client component to enable template management
 *
 * @dependencies
 * - ./superpromptor/_components/template-display: Client component for template upload and display
 *
 * @notes
 * - Marked as "use server" per project rules for server-side rendering
 * - No async data fetching required at this stage, so no Suspense wrapper needed
 * - Layout styling (e.g., padding) is handled by the root layout’s main element
 * - Will be expanded in future steps to include buttons (Refresh, Remove, Copy)
 */

import TemplateDisplay from "./_components/template-display"

export default async function SuperPromptorPage() {
  return <TemplateDisplay />
}