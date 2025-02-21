"use client"

/**
 * @file Template Display component for SuperPromptor
 * @description
 * This client-side component handles the upload and display of the markdown template
 * in the SuperPromptor application. It provides a file input for uploading `.md` files
 * and displays the template content as plain text (placeholder for now).
 *
 * Key features:
 * - File input restricted to `.md` files via accept attribute and extension validation
 * - Reads and stores template content in state using FileReader API
 * - Displays template content in a preformatted block for raw text preview
 *
 * @dependencies
 * - react: For state management (useState) and event handling
 *
 * @notes
 * - Uses "use client" directive as required for client-side interactivity per project rules
 * - Placed in `app/superpromptor/_components/` as a route-specific component
 * - Currently displays template as plain text; will be enhanced to render markdown in Step 6
 * - Validates file extension (.md) since MIME type (text/markdown) isn’t consistently supported
 * - Basic error handling: Alerts user if a non-.md file is uploaded
 * - Accessibility improved with a labeled input
 */

import { useState } from "react"

export default function TemplateDisplay() {
  // State to hold the uploaded template content
  const [template, setTemplate] = useState<string>("")

  /**
   * Handles file selection, reads the content of a .md file, and updates state.
   * @param event - The change event from the file input
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] // Get the first selected file
    if (file) {
      // Check if the file has a .md extension
      if (file.name.endsWith(".md")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          // Safely cast result as string and update state
          const content = e.target?.result as string
          setTemplate(content)
        }
        reader.readAsText(file) // Read file as text
      } else {
        alert("Please upload a .md file") // Notify user of invalid file type
        event.target.value = "" // Reset input to allow re-selection
      }
    }
  }

  return (
    <div className="p-4">
      {/* Label for accessibility */}
      <label htmlFor="template-upload" className="block mb-2 text-gray-700 dark:text-gray-300">
        Upload your markdown template:
      </label>
      
      {/* File input for .md templates */}
      <input
        id="template-upload"
        type="file"
        accept=".md" // Restrict to .md files in file picker
        onChange={handleFileChange}
        className="mb-4 text-gray-700 dark:text-gray-300" // Basic styling
      />

      {/* Display template content if available */}
      {template && (
        <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
          {template}
        </pre>
      )}
    </div>
  )
}