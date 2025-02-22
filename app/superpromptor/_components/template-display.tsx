/**
 * @file Template Display component for SuperPromptor
 * @description
 * This client-side component manages the upload, markdown rendering, and file selection
 * workflow for the SuperPromptor application. It provides a file input for uploading `.md`
 * templates, parses the template into segments with exact `<file>` tags replaced by FileSelector
 * components, and renders the result. It tracks selected files for each tag in a Map.
 *
 * Key features:
 * - File input restricted to `.md` files with validation
 * - Parses template using regex to replace only exact `<file>` tags
 * - Renders segments without causing re-render loops
 * - Tracks selected files per `<file>` tag in a Map
 * - Displays a placeholder if no template is uploaded
 *
 * @dependencies
 * - react: For state management (useState, useCallback) and event handling
 * - react-markdown: For rendering markdown segments between `<file>` tags
 * - ./file-selector: Client component for file selection buttons
 * - @/types: For FileData type
 *
 * @notes
 * - Uses regex to ensure only `<file>` tags are replaced, preserving other markdown tags
 * - Memoizes handleFilesSelected to prevent excessive re-renders in child components
 * - File selections are stored in a Map keyed by tag ID
 * - Edge case: `<file>` within code blocks may need special handling (future enhancement)
 */

"use client"

import { useState, useCallback } from "react"
import ReactMarkdown from 'react-markdown'
import FileSelector from './file-selector'
import { FileData } from '@/types'

/**
 * Represents a segment of the template: either markdown text or a FileSelector component.
 */
interface Segment {
  type: 'markdown' | 'fileSelector'
  content?: string // For markdown segments
  id?: string // For fileSelector segments
}

export default function TemplateDisplay() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [files, setFiles] = useState<Map<string, FileData[]>>(new Map())

  /**
   * Handles file selection from a FileSelector instance.
   * Updates the files Map with the selected files for the given tag ID.
   * Memoized to prevent unnecessary re-renders in FileSelector.
   * @param tagId - The unique ID of the `<file>` tag
   * @param selectedFiles - Array of selected FileData objects
   */
  const handleFilesSelected = useCallback((tagId: string, selectedFiles: FileData[]) => {
    setFiles((prevFiles) => {
      const newFiles = new Map(prevFiles)
      newFiles.set(tagId, selectedFiles)
      console.log(`Updated files for tag ${tagId}:`, selectedFiles)
      return newFiles
    })
  }, []) // Empty dependency array since it doesn’t depend on external state

  /**
   * Handles file selection, reads the content of a .md file, parses it into segments,
   * and updates state. Validates that the uploaded file is a .md file.
   * @param event - The change event from the file input
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    if (!file.name.endsWith(".md")) {
      alert("Please upload a .md file")
      event.target.value = "" // Reset the file input
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (!content) {
        alert("Failed to read the file content")
        return
      }

      // Parse the template using regex to match only exact <file> tags
      const regex = /<superpromptor-file>/g
      const newSegments: Segment[] = []
      let lastIndex = 0
      let counter = 0
      let match

      while ((match = regex.exec(content)) !== null) {
        // Add markdown segment before the <file> tag
        if (match.index > lastIndex) {
          newSegments.push({
            type: 'markdown',
            content: content.slice(lastIndex, match.index),
          })
        }

        // Add FileSelector segment
        const id = `file-${counter}`
        newSegments.push({
          type: 'fileSelector',
          id,
        })
        console.log(`Parsed FileSelector with id: ${id}`)
        counter++
        lastIndex = match.index + match[0].length
      }

      // Add any remaining markdown content after the last <file>
      if (lastIndex < content.length) {
        newSegments.push({
          type: 'markdown',
          content: content.slice(lastIndex),
        })
      }

      setSegments(newSegments)
      setFiles(new Map()) // Reset files when a new template is uploaded
      console.log('Template parsed and state updated:', newSegments)
    }
    reader.onerror = () => {
      alert("Error reading the file")
      console.error('File reading error:', reader.error)
    }
    reader.readAsText(file)
  }

  /**
   * Renders the parsed segments as a mix of markdown and FileSelector components.
   * This is a pure function with no state updates to prevent re-render loops.
   * @returns JSX.Element[] - Array of rendered elements
   */
  const renderTemplate = (): JSX.Element[] => {
    return segments.map((segment, index) => {
      if (segment.type === 'markdown') {
        return (
          <ReactMarkdown
            key={`markdown-${index}`}
            className="prose dark:prose-invert inline max-w-none"
          >
            {segment.content!}
          </ReactMarkdown>
        )
      } else if (segment.type === 'fileSelector') {
        return (
          <FileSelector
            key={segment.id}
            id={segment.id!}
            onFilesSelected={handleFilesSelected}
          />
        )
      }
      return null // Should never happen due to type safety
    })
  }

  return (
    <div className="p-4">
      <label htmlFor="template-upload" className="block mb-2 text-gray-700 dark:text-gray-300">
        Upload your markdown template:
      </label>

      <input
        id="template-upload"
        type="file"
        accept=".md"
        onChange={handleFileChange}
        className="mb-4 text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
      />

      {segments.length > 0 ? (
        <div className="inline-flex flex-wrap items-baseline gap-2">
          {renderTemplate()}
        </div>
      ) : (
        <p className="text-gray-500">Upload a template to get started</p>
      )}
    </div>
  )
}