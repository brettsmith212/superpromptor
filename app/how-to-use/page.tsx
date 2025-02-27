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
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import { TemplateEditorMarkdown, XMLParserMarkdown } from "../superpromptor/_lib/instructions"

export default function HowToUsePage() {

  return (
    // Outer container matching layout padding and full height
    <div className="min-h-screen p-8">
      {/* Centered content with max width for readability */}
      <div className="max-w-3xl mx-auto">
        {/* Main page title */}
        <h1 className="text-3xl font-bold mb-6">How To Use SuperPromptor</h1>
        {/* Markdown rendered content with custom styling */}
        <ReactMarkdown
          className="prose dark:prose-invert max-w-none prose-pre:bg-gray-700 prose-pre:p-4 prose-pre:rounded prose-code:text-red-500 prose-headings:text-blue-600 dark:prose-headings:text-blue-400 prose-a:text-blue-500 hover:prose-a:text-blue-700 dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-img:rounded-lg"
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          remarkPlugins={[remarkGfm]}
        >
          {TemplateEditorMarkdown}
        </ReactMarkdown>
        <h1 className="text-3xl font-bold mb-6 mt-8">How To Use XML Code Parser</h1>
        {/* Markdown rendered content with custom styling */}
        <ReactMarkdown
          className="prose dark:prose-invert max-w-none prose-pre:bg-gray-700 prose-pre:p-4 prose-pre:rounded prose-code:text-red-500 prose-headings:text-blue-600 dark:prose-headings:text-blue-400 prose-a:text-blue-500 hover:prose-a:text-blue-700 dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-img:rounded-lg"
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          remarkPlugins={[remarkGfm]}
        >
          {XMLParserMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  )
}