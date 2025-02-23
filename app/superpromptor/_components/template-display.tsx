/**
 * @file Template Display component for SuperPromptor
 * @description
 * This client-side component manages the upload, markdown rendering, file selection,
 * and template management workflow for the SuperPromptor application. It allows users
 * to upload a .md template, parses it into segments with `<superpromptor-file>` tags replaced by
 * FileSelector components, renders the result, and provides "Refresh", "Remove", and "Copy Contents To Clipboard"
 * buttons to manage the template and generate the final output. State is managed using useReducer for scalability.
 *
 * Key features:
 * - Uploads .md templates using showOpenFilePicker or <input type="file"> fallback
 * - Parses template to replace exact `<superpromptor-file>` tags with FileSelector components
 * - Renders markdown segments with file selection buttons
 * - Tracks selected files and their handles per `<superpromptor-file>` tag in a Map using a reducer
 * - Provides "Refresh" button to reload the template and all selected file contents from the filesystem
 * - Provides "Remove" button to reset the app state with a "Template Removed" alert
 * - Provides "Copy Contents To Clipboard" button to generate and copy the combined output
 * - Displays a disappearing alert for user feedback (e.g., "Template Refreshed", "Template Removed", "Copied to clipboard")
 *
 * @dependencies
 * - react: For state (useState, useCallback, useRef, useReducer) and event handling
 * - react-markdown: For rendering markdown segments
 * - ./file-selector: Client component for file selection buttons
 * - @/types: For FileDataWithHandle type
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
 * - Refreshing updates both template and file contents, preserving file selections
 * - Files selected via fallback (<input>) cannot be refreshed due to lack of handles
 */

"use client"

import React, { useState, useCallback, useRef, useReducer } from "react"
import ReactMarkdown from "react-markdown"
import FileSelector from "./file-selector"
import { FileDataWithHandle } from "@/types"
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

// Reducer types and functions
type Action =
  | { type: "SET_SEGMENTS"; payload: Segment[] }
  | { type: "SET_FILES"; payload: { tagId: string; files: FileDataWithHandle[] } }
  | { type: "CLEAR_FILES" }
  | { type: "RESET_STATE" }

interface State {
  segments: Segment[]
  files: Map<string, FileDataWithHandle[]>
}

const initialState: State = {
  segments: [],
  files: new Map(),
}

/**
 * Reducer function to manage template segments and file selections.
 * @param state - Current state of segments and files
 * @param action - Action to perform on the state
 * @returns New state based on the action
 */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_SEGMENTS":
      return { ...state, segments: action.payload }
    case "SET_FILES":
      const newFiles = new Map(state.files)
      newFiles.set(action.payload.tagId, action.payload.files)
      return { ...state, files: newFiles }
    case "CLEAR_FILES":
      return { ...state, files: new Map() }
    case "RESET_STATE":
      return initialState
    default:
      return state
  }
}

/**
 * Helper function to read file contents as text
 * @param file - File object to read
 * @returns Promise resolving to the file contents as a string
 */
async function readFileContents(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== "string") {
        reject(new Error("File content is not a string"))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export default function TemplateDisplay() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [templateHandle, setTemplateHandle] = useState<FileSystemFileHandle | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Parses the template content into segments of markdown and file selectors.
   * @param content - The raw markdown template content
   * @returns Array of Segment objects
   */
  const parseTemplate = (content: string): Segment[] => {
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

    return newSegments
  }

  /**
   * Handles file selection from a FileSelector instance.
   * Updates the files Map with the selected files and handles for the given tag ID.
   * @param tagId - The unique ID of the `<superpromptor-file>` tag
   * @param selectedFiles - Array of selected FileDataWithHandle objects
   */
  const handleFilesSelected = useCallback(
    (tagId: string, selectedFiles: FileDataWithHandle[]) => {
      dispatch({
        type: "SET_FILES",
        payload: { tagId, files: selectedFiles },
      })
    },
    []
  )

  /**
   * Creates a memoized file selection handler for a specific tag ID.
   * @param tagId - The unique ID of the file tag
   * @returns Function to handle file selections for this tag
   */
  const createFileSelectionHandler = useCallback(
    (tagId: string) => (files: FileDataWithHandle[]) => handleFilesSelected(tagId, files),
    [handleFilesSelected]
  )

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
        const newSegments = parseTemplate(content)
        dispatch({ type: "SET_SEGMENTS", payload: newSegments })
        dispatch({ type: "CLEAR_FILES" })
        setTemplateHandle(handle)
      } catch (error: any) {
        if (error.name === "AbortError") {
          return
        }
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
      const newSegments = parseTemplate(content)
      dispatch({ type: "SET_SEGMENTS", payload: newSegments })
      dispatch({ type: "CLEAR_FILES" })
      setTemplateHandle(null)
    }
    reader.onerror = () => {
      console.error("Error reading file:", reader.error)
      setAlertMessage("Failed to read the template file.")
    }
    reader.readAsText(file)
  }

  /**
   * Handles the Refresh button click to reload the template and all selected file contents from the filesystem.
   * Preserves the file selections while updating their contents if handles are available.
   */
  const handleRefresh = async () => {
    if (!templateHandle) {
      setAlertMessage("Please re-upload the template to refresh.")
      return
    }
    try {
      // Refresh the template
      const templateFile = await templateHandle.getFile()
      const templateContent = await templateFile.text()
      const newSegments = parseTemplate(templateContent)

      // Refresh all selected file contents
      const updatedFiles = new Map<string, FileDataWithHandle[]>()
      for (const [tagId, files] of state.files) {
        const refreshedFiles = await Promise.all(
          files.map(async (fileData) => {
            if (fileData.handle) {
              try {
                const file = await fileData.handle.getFile()
                const contents = await readFileContents(file)
                return { ...fileData, size: file.size, contents }
              } catch (error) {
                console.error(`Error refreshing file ${fileData.path}:`, error)
                return fileData // Keep old data if refresh fails
              }
            }
            return fileData // No handle, keep as-is
          })
        )
        updatedFiles.set(tagId, refreshedFiles)
      }

      // Update state with refreshed template and files
      dispatch({ type: "SET_SEGMENTS", payload: newSegments })
      for (const [tagId, files] of updatedFiles) {
        dispatch({ type: "SET_FILES", payload: { tagId, files } })
      }

      setAlertMessage("Template and files refreshed")
    } catch (error) {
      console.error("Error during refresh:", error)
      setAlertMessage("Failed to refresh. Some files may have been moved or deleted.")
    }
  }

  /**
   * Handles the Remove button click to reset the app state.
   */
  const handleRemove = () => {
    dispatch({ type: "RESET_STATE" })
    setTemplateHandle(null)
    setAlertMessage("Template Removed")
  }

  /**
   * Handles the Copy Contents To Clipboard button click.
   * Generates the output by combining the template and selected file contents,
   * then copies it to the clipboard.
   */
  const handleCopy = async () => {
    const outputParts = state.segments.map((segment) => {
      if (segment.type === "markdown") {
        return segment.content
      } else {
        const selectedFiles = state.files.get(segment.id!) || []
        return selectedFiles.map((file) => `-- ${file.path} --\n${file.contents}\n`).join("")
      }
    })
    const output = outputParts.join("")
    try {
      await navigator.clipboard.writeText(output)
      setAlertMessage("Copied to clipboard")
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      setAlertMessage("Failed to copy to clipboard. Please try again.")
    }
  }

  /**
   * Renders the parsed segments as markdown and FileSelector components.
   * @returns Array of rendered elements
   */
  const renderTemplate = useCallback(() => {
    return state.segments.map((segment, index) => {
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
  }, [state.segments, createFileSelectionHandler])

  return (
    <div className="p-4">
      {state.segments.length > 0 ? (
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