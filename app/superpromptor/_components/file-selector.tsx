"use client"

/**
 * @file File Selector component for SuperPromptor
 * @description
 * This client-side component renders a button for selecting files or folders
 * in the SuperPromptor application. It replaces `<file>` tags in the markdown template
 * and provides a clickable interface for future file selection logic.
 *
 * Key features:
 * - Renders a "Select Files" button inline with markdown content
 * - Receives a unique `id` prop for associating with specific `<file>` tags
 * - Logs clicks for debugging purposes
 *
 * @dependencies
 * - None (standalone component)
 *
 * @notes
 * - File selection logic will be added in Step 7
 * - Styled with Tailwind CSS for consistency with the design system
 * - Uses `inline-block` to render inline with markdown text
 * - Temporary click handler added to confirm button rendering
 */

interface FileSelectorProps {
  /**
   * A unique identifier for this file selector instance,
   * corresponding to a specific `<file>` tag in the template.
   */
  id: string
}

export default function FileSelector({ id }: FileSelectorProps) {
  // Temporary handler to confirm button rendering
  const handleClick = () => {
    console.log(`FileSelector button clicked, id: ${id}`);
  };

  return (
    <button
      onClick={handleClick}
      className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Select Files
    </button>
  );
}