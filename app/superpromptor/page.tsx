"use server"

/**
 * @file SuperPromptor main page
 * @description
 * This server-side page component serves as the entry point for the SuperPromptor
 * application's core functionality. It renders the TemplateDisplay component,
 * which handles template upload, display, and management (including Refresh and Remove features).
 *
 * Key features:
 * - Renders the TemplateDisplay client component to enable template management
 *
 * @dependencies
 * - ./superpromptor/_components/template-display: Client component for template functionality
 *
 * @notes
 * - Marked as "use server" per project rules for server-side rendering
 * - No async data fetching required, so no Suspense wrapper needed
 * - Layout styling (e.g., padding) is handled by the root layout’s main element
 * - Refresh and Remove buttons are implemented in TemplateDisplay (Step 11),
 *   rather than here, as this is a server component and cannot handle interactivity
 */

import TemplateDisplay from "./_components/template-display"

export default async function SuperPromptorPage() {
  return <TemplateDisplay />
}