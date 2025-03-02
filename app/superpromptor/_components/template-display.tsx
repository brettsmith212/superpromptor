/**
 * @file Template Display component for SuperPromptor
 * @description
 * This client-side component manages the upload, markdown rendering, file selection,
 * and template management workflow for the SuperPromptor application. It allows users
 * to upload a .md template, parses it into segments with `<superpromptor-file>` and `<superpromptor-input>` tags replaced by
 * FileSelector and Textarea components, renders the result, and provides "Refresh", "Remove", and "Copy Contents To Clipboard"
 * buttons to manage the template and generate the final output. State is managed using useReducer for scalability.
 *
 * Key features:
 * - Uploads .md templates using showOpenFilePicker or <input type="file"> fallback
 * - Parses template to replace exact `<superpromptor-file>` and `<superpromptor-input>` tags with FileSelector and Textarea components
 * - Renders markdown segments with file selection buttons and input boxes, ensuring content after components starts on a new line
 * - Tracks selected files and their handles per `<superpromptor-file>` tag and input values per `<superpromptor-input>` tag in Maps using a reducer
 * - Provides "Refresh" button to reload the template and all selected file contents from the filesystem
 * - Provides "Remove" button to reset the app state with a "Template Removed" alert
 * - Provides "Copy Contents To Clipboard" button to generate and copy the combined output
 * - Displays a disappearing alert for user feedback (e.g., "Template Refreshed", "Template Removed", "Copied to clipboard")
 * - Handles errors for non-.md uploads, file access issues, and clipboard operations
 * - Silently ignores AbortError for user cancellations
 * - Alert animations require AnimatePresence in the parent component
 * - Refreshing updates both template and file contents, preserving file selections
 * - Files selected via fallback (<input>) cannot be refreshed due to lack of handles
 */

"use client"

import React, { useState, useCallback, useRef, useReducer, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import FileSelector from "./file-selector"
import { FileDataWithHandle } from "@/types"
import { AnimatePresence } from "framer-motion"
import Alert from "@/components/alert"
import { encodingForModel } from 'js-tiktoken'
import { TemplateEditorMarkdown } from "../_lib/instructions"
import { Button } from "@/components/ui/button"
import { ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Textarea } from "@/components/ui/textarea"

/**
 * Represents a segment of the template: either markdown text, a FileSelector component, or an input box.
 */
type Segment =
  | { type: "markdown"; content: string }
  | { type: "fileSelector"; id: string }
  | { type: "input"; id: string }

// Reducer types and functions
type Action =
  | { type: "SET_SEGMENTS"; payload: Segment[] }
  | { type: "SET_FILES"; payload: { tagId: string; files: FileDataWithHandle[] } }
  | { type: "CLEAR_FILES" }
  | { type: "RESET_STATE" }
  | { type: "SET_INPUT_VALUE"; payload: { inputId: string; value: string } }
  | { type: "CLEAR_INPUTS" }

interface State {
  segments: Segment[]
  files: Map<string, FileDataWithHandle[]>
  inputs: Map<string, string>
}

const initialState: State = {
  segments: [],
  files: new Map(),
  inputs: new Map(),
}

/**
 * Reducer function to manage template segments, file selections, and input values.
 * @param state - Current state of segments, files, and inputs
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
    case "SET_INPUT_VALUE":
      const { inputId, value } = action.payload
      const newInputs = new Map(state.inputs)
      newInputs.set(inputId, value)
      return { ...state, inputs: newInputs }
    case "CLEAR_INPUTS":
      return { ...state, inputs: new Map() }
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

export default function TemplateDisplay({ starterTemplates }: { starterTemplates: string[] }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [templateHandle, setTemplateHandle] = useState<FileSystemFileHandle | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [alertType, setAlertType] = useState<"info" | "error">("info")
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false) // Added for loading spinner
  const fileInputRef = useRef<HTMLInputElement>(null)

  const encoding = useMemo(() => encodingForModel('gpt-3.5-turbo'), [])

  const totalTokens = useMemo(() => {
    let count = 0
    state.segments.forEach((segment) => {
      if (segment.type === 'markdown') {
        const tokens = encoding.encode(segment.content)
        count += tokens.length
      } else if (segment.type === 'fileSelector') {
        const selectedFiles = state.files.get(segment.id) || []
        selectedFiles.forEach((file) => {
          const header = `-- ${file.path} --\n`
          const fileText = header + (file.contents || '') + '\n'
          const fileTokens = encoding.encode(fileText)
          count += fileTokens.length
        })
      } else if (segment.type === 'input') {
        const inputValue = state.inputs.get(segment.id) || ''
        const tokens = encoding.encode(inputValue)
        count += tokens.length
      }
    })
    return count
  }, [state.segments, state.files, state.inputs, encoding])

  /**
   * Parses the template content into segments of markdown, file selectors, or inputs.
   * @param content - The raw markdown template content
   * @returns Array of Segment objects
   */
  const parseTemplate = (content: string): Segment[] => {
    const regex = /<(superpromptor-file|superpromptor-input)>/g
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
      const tagType = match[1] // "superpromptor-file" or "superpromptor-input"
      const segmentType = tagType === "superpromptor-file" ? "fileSelector" : "input"
      const id = `${segmentType === "fileSelector" ? "file" : "input"}-${counter}`
      newSegments.push({
        type: segmentType,
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
        if (!file.name.endsWith(".md")) {
          setAlertMessage("Please upload a .md file")
          setAlertType("error")
          return
        }
        const content = await file.text()
        const newSegments = parseTemplate(content)
        dispatch({ type: "SET_SEGMENTS", payload: newSegments })
        dispatch({ type: "CLEAR_FILES" })
        dispatch({ type: "CLEAR_INPUTS" })
        setTemplateHandle(handle)
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        console.error("Error selecting template:", error)
        setAlertMessage("Failed to upload template. Please try again.")
        setAlertType("error")
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
      setAlertType("error")
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const newSegments = parseTemplate(content)
      dispatch({ type: "SET_SEGMENTS", payload: newSegments })
      dispatch({ type: "CLEAR_FILES" })
      dispatch({ type: "CLEAR_INPUTS" })
      setTemplateHandle(null)
    }
    reader.onerror = () => {
      console.error("Error reading file:", reader.error)
      setAlertMessage("Failed to read the template file.")
      setAlertType("error")
    }
    reader.readAsText(file)
  }

  /**
   * Handles the Refresh button click to reload the template (if uploaded) and all selected file contents from the filesystem.
   * For starter templates, refreshes only selected files if present. Preserves file selections and input values while updating file contents if handles are available.
   * If nothing can be refreshed, completes silently without error.
   */
  const handleRefresh = async () => {
    try {
      let templateRefreshed = false
      let filesRefreshed = false

      // Refresh the template if an uploaded template handle exists
      if (templateHandle) {
        const templateFile = await templateHandle.getFile()
        const templateContent = await templateFile.text()
        const newSegments = parseTemplate(templateContent)
        dispatch({ type: "SET_SEGMENTS", payload: newSegments })
        templateRefreshed = true
      }

      // Refresh all selected file contents if any files are selected
      if (state.files.size > 0) {
        const updatedFiles = new Map<string, FileDataWithHandle[]>()
        for (const [tagId, files] of state.files) {
          const refreshedFiles = await Promise.all(
            files.map(async (fileData) => {
              if (fileData.handle) {
                try {
                  const file = await fileData.handle.getFile()
                  const contents = await readFileContents(file)
                  filesRefreshed = true
                  return { ...fileData, size: file.size, contents }
                } catch (error) {
                  console.error(`Error refreshing file ${fileData.path}:`, error)
                  setAlertMessage(`Failed to refresh file: ${fileData.path}`)
                  setAlertType("error")
                  return fileData // Keep old data if refresh fails
                }
              }
              return fileData // No handle, keep as-is
            })
          )
          updatedFiles.set(tagId, refreshedFiles)
        }

        // Update state with refreshed files
        for (const [tagId, files] of updatedFiles) {
          dispatch({ type: "SET_FILES", payload: { tagId, files } })
        }
      }

      // Set appropriate success message based on what was refreshed
      if (templateRefreshed && filesRefreshed) {
        setAlertMessage("Template and files refreshed")
        setAlertType("info")
      } else if (templateRefreshed) {
        setAlertMessage("Template refreshed")
        setAlertType("info")
      } else if (filesRefreshed) {
        setAlertMessage("Files refreshed")
        setAlertType("info")
      }
      // If neither template nor files were refreshed (e.g., no files selected), do nothing silently

    } catch (error) {
      console.error("Error during refresh:", error)
      setAlertMessage("Failed to refresh. Some files may have been moved or deleted.")
      setAlertType("error")
    }
  }

  /**
   * Handles the Remove button click to reset the app state.
   */
  const handleRemove = () => {
    dispatch({ type: "RESET_STATE" })
    setTemplateHandle(null)
    setAlertMessage("Template Removed")
    setAlertType("info")
  }

  /**
   * Handles the Copy Contents To Clipboard button click.
   * Generates the output by combining the template, selected file contents, and input values,
   * then copies it to the clipboard.
   */
  const handleCopy = async () => {
    const outputParts = state.segments.map((segment) => {
      if (segment.type === "markdown") {
        return segment.content
      } else if (segment.type === "fileSelector") {
        const selectedFiles = state.files.get(segment.id) || []
        return selectedFiles.map((file) => `-- ${file.path} --\n${file.contents}\n`).join("")
      } else if (segment.type === "input") {
        return state.inputs.get(segment.id) || ''
      }
    })
    const output = outputParts.join("")
    try {
      await navigator.clipboard.writeText(output)
      setAlertMessage("Copied to clipboard")
      setAlertType("info")
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      setAlertMessage("Failed to copy to clipboard. Please ensure clipboard permissions are enabled.")
      setAlertType("error")
    }
  }

  /**
   * Handles selecting a starter template with loading state.
   * @param templateName - The name of the selected template
   */
  const handleSelectTemplate = async (templateName: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/templates/${templateName}`)
      if (!response.ok) {
        throw new Error('Failed to fetch template')
      }
      const content = await response.text()
      const newSegments = parseTemplate(content)
      dispatch({ type: "SET_SEGMENTS", payload: newSegments })
      dispatch({ type: "CLEAR_FILES" })
      dispatch({ type: "CLEAR_INPUTS" })
      setTemplateHandle(null)
      setAlertMessage(`Loaded starter template: ${templateName}`)
      setAlertType("info")
    } catch (error) {
      console.error('Error loading starter template:', error)
      setAlertMessage('Failed to load starter template')
      setAlertType("error")
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Renders the parsed segments as markdown, FileSelector components, or Textarea inputs.
   * @returns Array of rendered elements
   */
  const renderTemplate = useCallback(() => {
    return state.segments.map((segment, index) => {
      if (segment.type === "markdown") {
        return (
          <div key={`markdown-${index}`} className="markdown-container">
            <ReactMarkdown
              className="prose dark:prose-invert max-w-none prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded prose-code:text-red-500 prose-headings:text-black-600 dark:prose-headings:text-black-400 prose-a:text-black-500 hover:prose-a:text-black-700 dark:prose-a:text-black-400 dark:hover:prose-a:text-black-300 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-img:rounded-lg"
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              remarkPlugins={[remarkGfm]}
            >
              {segment.content}
            </ReactMarkdown>
          </div>
        )
      } else if (segment.type === "fileSelector") {
        const onFilesSelected = createFileSelectionHandler(segment.id)
        return (
          <div key={segment.id} className="block">
            <FileSelector
              id={segment.id}
              onFilesSelected={onFilesSelected}
            />
          </div>
        )
      } else if (segment.type === "input") {
        const value = state.inputs.get(segment.id) || ''
        return (
          <div key={segment.id} className="markdown-container">
            <Textarea
              value={value}
              onChange={(e) => dispatch({ type: "SET_INPUT_VALUE", payload: { inputId: segment.id, value: e.target.value } })}
              className="w-full resize-y"
              placeholder="Enter your text here"
            />
          </div>
        )
      }
    })
  }, [state.segments, state.inputs, createFileSelectionHandler, dispatch])

  return (
    <div className="p-4">
      {state.segments.length > 0 ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold">Template</h2>
              <span className="text-sm text-gray-500">
                Total Tokens: {new Intl.NumberFormat().format(totalTokens)}
              </span>
            </div>
            <div className="space-x-2">
              <button
                onClick={handleCopy}
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Copy Contents To Clipboard
              </button>
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
          <div className="flex flex-col gap-2">
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
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 items-center">
            <Button
              onClick={handleUpload}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              Upload Template
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="text-blue-500 border-gray-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2">
                        <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      Loading...
                    </div>
                  ) : (
                    <>
                      Starter Templates <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-auto min-w-[var(--radix-dropdown-menu-trigger-width)]">
                {starterTemplates.map((template) => (
                  <DropdownMenuItem
                    key={template}
                    onSelect={() => handleSelectTemplate(template)}
                    className="px-2 py-1.5 text-sm hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-gray-100 transition-colors focus:bg-gray-300 dark:focus:bg-gray-500 cursor-pointer"
                  >
                    {template}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
              className="w-fit flex justify-start items-center"
            >
              <span className="mr-2">{isInstructionsOpen ? "▼" : "▶"}</span>
              How to Use Template Prompt Editor
            </Button>
            {isInstructionsOpen && (
              <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded">
                <ReactMarkdown
                  className="prose dark:prose-invert max-w-none prose-pre:bg-gray-700 prose-pre:p-4 prose-pre:rounded prose-code:text-red-500 prose-headings:text-black-600 dark:prose-headings:text-black-400 prose-a:text-black-500 hover:prose-a:text-black-700 dark:prose-a:text-black-400 dark:hover:prose-a:text-black-300 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-img:rounded-lg"
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  remarkPlugins={[remarkGfm]}
                >
                  {TemplateEditorMarkdown}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
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
            type={alertType}
            onClose={() => setAlertMessage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}