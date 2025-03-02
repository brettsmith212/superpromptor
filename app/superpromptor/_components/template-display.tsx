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

interface Segment {
  type: "markdown" | "fileSelector"
  content?: string
  id?: string
}

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const encoding = useMemo(() => encodingForModel('gpt-3.5-turbo'), [])

  const totalTokens = useMemo(() => {
    let count = 0
    state.segments.forEach((segment) => {
      if (segment.type === 'markdown') {
        const tokens = encoding.encode(segment.content || '')
        count += tokens.length
      } else {
        const selectedFiles = state.files.get(segment.id!) || []
        selectedFiles.forEach((file) => {
          const header = `-- ${file.path} --\n`
          const fileText = header + (file.contents || '') + '\n'
          const fileTokens = encoding.encode(fileText)
          count += fileTokens.length
        })
      }
    })
    return count
  }, [state.segments, state.files, encoding])

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

  const handleFilesSelected = useCallback(
    (tagId: string, selectedFiles: FileDataWithHandle[]) => {
      dispatch({
        type: "SET_FILES",
        payload: { tagId, files: selectedFiles },
      })
    },
    []
  )

  const createFileSelectionHandler = useCallback(
    (tagId: string) => (files: FileDataWithHandle[]) => handleFilesSelected(tagId, files),
    [handleFilesSelected]
  )

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

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
      setTemplateHandle(null)
    }
    reader.onerror = () => {
      console.error("Error reading file:", reader.error)
      setAlertMessage("Failed to read the template file.")
      setAlertType("error")
    }
    reader.readAsText(file)
  }

  const handleRefresh = async () => {
    if (!templateHandle) {
      setAlertMessage("Please re-upload the template to refresh.")
      setAlertType("error")
      return
    }
    try {
      const templateFile = await templateHandle.getFile()
      const templateContent = await templateFile.text()
      const newSegments = parseTemplate(templateContent)

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
                setAlertMessage(`Failed to refresh file: ${fileData.path}`)
                setAlertType("error")
                return fileData
              }
            }
            return fileData
          })
        )
        updatedFiles.set(tagId, refreshedFiles)
      }

      dispatch({ type: "SET_SEGMENTS", payload: newSegments })
      for (const [tagId, files] of updatedFiles) {
        dispatch({ type: "SET_FILES", payload: { tagId, files } })
      }

      setAlertMessage("Template and files refreshed")
      setAlertType("info")
    } catch (error) {
      console.error("Error during refresh:", error)
      setAlertMessage("Failed to refresh. Some files may have been moved or deleted.")
      setAlertType("error")
    }
  }

  const handleRemove = () => {
    dispatch({ type: "RESET_STATE" })
    setTemplateHandle(null)
    setAlertMessage("Template Removed")
    setAlertType("info")
  }

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
      setAlertType("info")
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      setAlertMessage("Failed to copy to clipboard. Please ensure clipboard permissions are enabled.")
      setAlertType("error")
    }
  }

  const handleSelectTemplate = async (templateName: string) => {
    try {
      const response = await fetch(`/api/templates/${templateName}`)
      if (!response.ok) {
        throw new Error('Failed to fetch template')
      }
      const content = await response.text()
      const newSegments = parseTemplate(content)
      dispatch({ type: "SET_SEGMENTS", payload: newSegments })
      dispatch({ type: "CLEAR_FILES" })
      setTemplateHandle(null)
      setAlertMessage(`Loaded starter template: ${templateName}`)
      setAlertType("info")
    } catch (error) {
      console.error('Error loading starter template:', error)
      setAlertMessage('Failed to load starter template')
      setAlertType("error")
    }
  }

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
              {segment.content!}
            </ReactMarkdown>
          </div>
        )
      }
      const onFilesSelected = createFileSelectionHandler(segment.id!)
      return (
        <div key={segment.id} className="block">
          <FileSelector
            id={segment.id!}
            onFilesSelected={onFilesSelected}
          />
        </div>
      )
    })
  }, [state.segments, createFileSelectionHandler])

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
                className="px-2 py-1 bg-green-500 text-white rounded hover:bg-blue-600"
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
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Upload Template
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-blue-500 border-gray-300">
                  Starter Templates <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {starterTemplates.map((template) => (
                  <DropdownMenuItem key={template} onSelect={() => handleSelectTemplate(template)}>
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