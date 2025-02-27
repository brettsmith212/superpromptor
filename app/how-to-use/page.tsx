/**
 * @file How To Use page for SuperPromptor
 * @description
 * This client-side page component provides static instructions on how to use
 * the SuperPromptor application. It renders markdown content explaining the
 * steps to upload a template, select files, and copy the output, fulfilling
 * the navigation requirement for an instructional page.
 *
 * Key features:
 * - Renders static markdown instructions using react-markdown
 * - Styled with Tailwind CSS for readability and consistency with the design system
 * - Includes step-by-step usage instructions and additional feature notes
 *
 * @dependencies
 * - react-markdown: For rendering markdown content in React
 *
 * @notes
 * - Marked as "use client" to enable client-side rendering of react-markdown
 * - Markdown content is defined as a string within the component for simplicity
 * - Styling uses Tailwind classes applied via the components prop of ReactMarkdown
 * - The main title is rendered as an h1 outside the markdown for consistency with other pages
 * - All code snippets (e.g., `.md`, `<file>`) are rendered inline per user feedback
 * - Assumes react-markdown was installed in Step 1 as per the implementation plan
 */

"use client"

import ReactMarkdown from 'react-markdown'

export default function HowToUsePage() {
  // Markdown content explaining how to use SuperPromptor
  const TemplateEditorMarkdown = `
SuperPromptor is a tool designed to help you create prompts for large language models (LLMs) by combining a markdown template with file contents.

## Steps to Use SuperPromptor

1. **Upload a Markdown Template**
   - Click on the "Upload Template" button on the main page.
   - Select a \`.md\` file from your local file system.
   - The markdown template should contain \`<superpromptor-file>\` tags where you want to insert file contents.

2. **Select Files or Folders**
   - For each \`<superpromptor-file>\` tag in your markdown template, a "Select Files" button will appear.
   - Click on "Select Files" to choose files or folders to include.
   - You can select multiple files or an entire folder.
   - If you select a folder, a tree view will allow you to choose specific files or subfolders.

3. **Review and Adjust Selections**
   - Below each "Select Files" button, you'll see a list of selected files with their relative paths and sizes.
   - You can remove individual files by clicking the remove button next to each file.
   - Use the plus sign to add more files if needed.

4. **Copy the Output**
   - Once you've selected all necessary files, click the "Copy Contents To Clipboard" button.
   - This will combine the template with the selected file contents and copy the result to your clipboard.
   - You can then paste this into your LLM chatbox.

## Additional Features

- **Refresh Template**: If you've updated your template file, click "Refresh" to reload it.
- **Remove Template**: Click "Remove" to clear the uploaded template and reset the app.

## Notes

- Only \`.md\` files are supported for templates.
- Files larger than 10MB will trigger a warning; you can choose to include or exclude them.
- The output format for each file is: \`-- relative/path/filename --\\n[file contents]\\n\`
  `
const XMLParserMarkdown = `
## Steps to Use XML Code Parser

1. **Select a Project Directory**
   - The directory chosen will be where the code changes are inserted.

2. **Paste XML Code Changes**
   - Paste the XML code changes into the textarea.

3. **Apply Changes**
   - Click "Apply Changes" to insert the changes into the selected project directory.

`

  return (
    // Outer container matching layout padding and full height
    <div className="min-h-screen p-8">
      {/* Centered content with max width for readability */}
      <div className="max-w-3xl mx-auto">
        {/* Main page title */}
        <h1 className="text-3xl font-bold mb-6">How To Use SuperPromptor</h1>
        {/* Markdown rendered content with custom styling */}
        <ReactMarkdown
          components={{
            // Custom h2 styling for section headings
            h2: ({ ...props }) => <h2 className="text-xl font-semibold mb-3" {...props} />,
            // Paragraph styling for consistent spacing
            p: ({ ...props }) => <p className="mb-4" {...props} />,
            // Unordered list styling for bullet points
            ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
            // Inline code styling for all backticked content
            code: ({ ...props }) => (
              <code
                className="inline bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm"
                {...props}
              />
            ),
          }}
        >
          {TemplateEditorMarkdown}
        </ReactMarkdown>
        <h1 className="text-3xl font-bold mb-6">How To Use XML Code Parser</h1>
        {/* Markdown rendered content with custom styling */}
        <ReactMarkdown
          components={{
            // Custom h2 styling for section headings
            h2: ({ ...props }) => <h2 className="text-xl font-semibold mb-3" {...props} />,
            // Paragraph styling for consistent spacing
            p: ({ ...props }) => <p className="mb-4" {...props} />,
            // Unordered list styling for bullet points
            ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
            // Inline code styling for all backticked content
            code: ({ ...props }) => (
              <code
                className="inline bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm"
                {...props}
              />
            ),
          }}
        >
          {XMLParserMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  )
}