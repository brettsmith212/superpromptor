/**
 * @file Template Display component for SuperPromptor
 * @description
 * This client-side component manages the upload, markdown rendering, file selection,
 * and template management workflow for the SuperPromptor application. It allows users
 * to upload a .md template, parses it into segments with `<superpromptor-file>` tags replaced by
 * FileSelector components, renders the result, and provides "Refresh", "Remove", and "Copy Contents To Clipboard"
 * buttons to manage the template and generate the final output.
 *
 * Key features:
 * - Uploads .md templates using showOpenFilePicker or <input type="file"> fallback
 * - Parses template to replace exact `<superpromptor-file>` tags with FileSelector components
 * - Renders markdown segments with file selection buttons
 * - Tracks selected files per `<superpromptor-file>` tag in a Map
 * - Provides "Refresh" button to reload the template from the filesystem, preserving selected files, with a "Template Refreshed" alert
 * - Provides "Remove" button to reset the app state with a "Template Removed" alert
 * - Provides "Copy Contents To Clipboard" button to generate and copy the combined output
 * - Displays a disappearing alert for user feedback (e.g., "Template Refreshed", "Template Removed", "Copied to clipboard")
 *
 * @dependencies
 * - react: For state (useState, useCallback, useRef) and event handling
 * - react-markdown: For rendering markdown segments
 * - ./file-selector: Client component for file selection buttons
 * - @/types: For FileData type
 * - framer-motion: For AnimatePresence to manage alert animations
 * - @/components/alert: Reusable alert component for feedback
 *
 * @notes
 * - Uses regex to ensure only exact `<superpromptor-file>` tags are replaced
 * - Stores FileSystemFileHandle for refresh functionality when available
 * - Falls back to prompting re-upload in browsers without File System Access API
 * - Buttons are styled with Tailwind per the design system
 * - Error handling covers file reading failures and invalid file types; silently ignores AbortError for user cancellations
 * - Alert animations require AnimatePresence in the parent component
 * - Refreshing reloads the template but preserves selected files, per user preference, with a success alert
 */

"use client"

import React, { useState, useCallback, useRef } from "react"
import ReactMarkdown from "react-markdown"
import FileSelector from "./file-selector"
import { FileData } from "@/types"
import { AnimatePresence } from "framer-motion"
import Alert from "@/components/alert"

/**
 * Represents a segment of the template: either markdown text or a FileSelector component.
 */
interface Segment {
  type: "markdown" | "fileSelector"
  content?: string // For markdown segments
  id?: string     // For fileSelector segments
}

export default function TemplateDisplay() {
  const [templateHandle, setTemplateHandle] = useState<FileSystemFileHandle | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [files, setFiles] = useState<Map<string, FileData[]>>(new Map())
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handles file selection from a FileSelector instance.
   * Updates the files Map with the selected files for the given tag ID.
   * @param tagId - The unique ID of the `<superpromptor-file>` tag
   * @param selectedFiles - Array of selected FileData objects
   */
  const handleFilesSelected = useCallback((tagId: string, selectedFiles: FileData[]) => {
    setFiles((prevFiles) => {
      const newFiles = new Map(prevFiles)
      newFiles.set(tagId, selectedFiles)
      return newFiles
    })
  }, [])

  /**
   * Creates a memoized file selection handler for a specific tag ID.
   * @param tagId - The unique ID of the file tag
   * @returns Function to handle file selections for this tag
   */
  const createFileSelectionHandler = useCallback(
    (tagId: string) => (files: FileData[]) => handleFilesSelected(tagId, files),
    [handleFilesSelected]
  )

  /**
   * Parses the template content into segments of markdown and file selectors.
   * @param content - The raw markdown template content
   */
  const parseAndSetSegments = (content: string) => {
    const regex = /<superpromptor-file>/g
    const newSegments: Segment[] = []
    let lastIndex = 0
    let counter = 0
    let match

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        newSegments.push({
          type: "markdown",
          content: content.slice(lastIndex, match.index),
        })
      }
      const id = `file-${counter}`
      newSegments.push({
        type: "fileSelector",
        id,
      })
      counter++
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < content.length) {
      newSegments.push({
        type: "markdown",
        content: content.slice(lastIndex),
      })
    }

    setSegments(newSegments)
  }

  /**
   * Handles template upload using showOpenFilePicker if available, or triggers file input.
   * Silently ignores AbortError if the user cancels the file picker.
   */
  const handleUpload = async () => {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [
            {
              description: "Markdown files",
              accept: {
                "text/markdown": [".md"],
              },
            },
          ],
          excludeAcceptAllOption: true,
          multiple: false,
        })
        const file = await handle.getFile()
        const content = await file.text()
        parseAndSetSegments(content)
        setTemplateHandle(handle)
        setFiles(new Map())
      } catch (error: any) {
        if (error.name === "AbortError") {
          // User canceled the file picker; silently ignore with no feedback
          return
        }
        // Log and alert only for non-cancellation errors
        console.error("Error selecting template:", error)
        setAlertMessage("Failed to upload template. Please try again.")
      }
    } else {
      fileInputRef.current?.click()
    }
  }

  /**
   * Handles file input change for browsers without showOpenFilePicker support.
   * @param event - The change event from the file input
   */
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return // User canceled the file input

    if (!file.name.endsWith(".md")) {
      setAlertMessage("Please upload a .md file")
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      parseAndSetSegments(content)
      setTemplateHandle(null)
      setFiles(new Map())
    }
    reader.onerror = () => {
      console.error("Error reading file:", reader.error)
      setAlertMessage("Failed to read the template file.")
    }
    reader.readAsText(file)
  }

  /**
   * Handles the Refresh button click to reload the template from the filesystem.
   * Preserves the currently selected files and shows a "Template Refreshed" alert on success.
   */
  const handleRefresh = async () => {
    if (templateHandle) {
      try {
        const file = await templateHandle.getFile()
        const content = await file.text()
        parseAndSetSegments(content)
        // Selected files are preserved in the files Map
        setAlertMessage("Template Refreshed")
      } catch (error) {
        console.error("Error refreshing template:", error)
        setAlertMessage("Failed to refresh template. The file may have been moved or deleted.")
      }
    } else {
      setAlertMessage("Please re-upload the template to refresh.")
    }
  }

  /**
   * Handles the Remove button click to reset the app state.
   */
  const handleRemove = () => {
    setSegments([])
    setFiles(new Map())
    setTemplateHandle(null)
    setAlertMessage("Template Removed")
  }

  /**
   * Handles the Copy Contents To Clipboard button click.
   * Generates the output by combining the template and selected file contents,
   * then copies it to the clipboard.
   */
  const handleCopy = async () => {
    // Iterate through segments to build output parts
    const outputParts = segments.map(segment => {
      if (segment.type === "markdown") {
        // Include markdown content as-is for markdown segments
        return segment.content
      } else {
        // Get selected files for this fileSelector segment's ID
        const selectedFiles = files.get(segment.id!) || []
        // Format each file's content with path separator and contents,
        // joining them without additional separators
        return selectedFiles.map(file => `-- ${file.path} --\n${file.contents}\n`).join('')
      }
    })
    // Join all output parts into a single string without additional separators
    const output = outputParts.join('')
    try {
      // Attempt to copy the output to the clipboard using the Clipboard API
      await navigator.clipboard.writeText(output)
      // Show success alert using existing alert system
      setAlertMessage("Copied to clipboard")
    } catch (error) {
      // Log clipboard write error for debugging
      console.error("Failed to copy to clipboard:", error)
      // Show error alert to inform user
      setAlertMessage("Failed to copy to clipboard. Please try again.")
    }
  }

  /**
   * Renders the parsed segments as markdown and FileSelector components.
   * @returns Array of rendered elements
   */
  const renderTemplate = useCallback(() => {
    return segments.map((segment, index) => {
      if (segment.type === "markdown") {
        return (
          <ReactMarkdown
            key={`markdown-${index}`}
            className="prose dark:prose-invert inline max-w-none"
          >
            {segment.content!}
          </ReactMarkdown>
        )
      }
      const onFilesSelected = createFileSelectionHandler(segment.id!)
      return (
        <FileSelector
          key={segment.id}
          id={segment.id!}
          onFilesSelected={onFilesSelected}
        />
      )
    })
  }, [segments, createFileSelectionHandler])

  return (
    <div className="p-4">
      {segments.length > 0 ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Template</h2>
            <div className="space-x-2">
              <button
                onClick={handleRefresh}
                className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Refresh
              </button>
              <button
                onClick={handleRemove}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
          <div className="inline-flex flex-wrap items-baseline gap-2">
            {renderTemplate()}
          </div>
          <div className="mt-4">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Copy Contents To Clipboard
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Upload Template
        </button>
      )}

      <input
        type="file"
        accept=".md"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileInputChange}
      />

      <AnimatePresence>
        {alertMessage && (
          <Alert
            key="alert"
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}