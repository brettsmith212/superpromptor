/**
 * @file XML Parser component for SuperPromptor
 * @description
 * This client-side component renders a UI for users to paste XML code change instructions
 * and apply them to a selected project directory on their local machine. It replaces the
 * previous server-side approach by using the File System Access API to perform file operations
 * directly in the browser.
 *
 * Key features:
 * - Allows users to select a project directory using a folder picker
 * - Accepts XML input via a textarea
 * - Parses XML and applies changes (CREATE, UPDATE, DELETE) to the local file system
 * - Displays success/error messages using Tailwind styling
 * - Uses shadcn buttons for consistent UI
 *
 * @dependencies
 * - react: For state management with useState
 * - "@/lib/xml-parser": For parsing XML into file changes
 *
 * @notes
 * - Marked as "use client" for client-side rendering and File System Access API usage
 * - Previously relied on a server action; now handles all operations client-side
 * - Assumes File System Access API support (Chrome/Edge); no fallback implemented
 */

"use client"

import { useState, useEffect } from "react"
import { parseXmlString, ParsedFileChange } from "@/lib/xml-parser"

async function applyChange(directoryHandle: FileSystemDirectoryHandle, change: ParsedFileChange) {
  const { file_operation, file_path, file_code } = change
  const pathParts = file_path.split("/")
  let currentHandle: FileSystemHandle = directoryHandle

  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i]
    if (i === pathParts.length - 1) {
      if (file_operation.toUpperCase() === "DELETE") {
        try {
          await (currentHandle as FileSystemDirectoryHandle).removeEntry(part)
        } catch (error) {
          console.warn(`Failed to delete file ${file_path}:`, error)
        }
      } else {
        const fileHandle = await (currentHandle as FileSystemDirectoryHandle).getFileHandle(part, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(file_code || "")
        await writable.close()
      }
    } else {
      currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle(part, { create: true })
    }
  }
}

export default function XmlParser() {
  const [xml, setXml] = useState<string>("")
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (successMessage) {
      timer = setTimeout(() => {
        setSuccessMessage("")
      }, 2000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [successMessage])

  const handleSelectDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker()
      setDirectoryHandle(handle)
      setErrorMessage("") // Clear any previous error message
      setSuccessMessage(`Selected directory: ${handle.name}`)
    } catch (error) {
      // Only handle errors that are NOT AbortError (user canceled)
      if (error instanceof DOMException && error.name === "AbortError") {
        // User canceled the picker; silently return without setting an error
        return
      }
      // For other errors, log and display an error message
      console.error("Error selecting directory:", error)
      setErrorMessage("Failed to select directory")
    }
  }

  const handleApply = async () => {
    setErrorMessage("")
    setSuccessMessage("")
    if (!directoryHandle) {
      setErrorMessage("Please select a project directory first")
      return
    }
    if (!xml.trim()) {
      setErrorMessage("Please paste XML before applying changes")
      return
    }
    try {
      const changes = await parseXmlString(xml)
      if (!changes) {
        setErrorMessage("Invalid XML")
        return
      }
      for (const change of changes) {
        await applyChange(directoryHandle, change)
      }
      setSuccessMessage("Changes applied successfully")
      setXml("")
    } catch (error) {
      console.error("Error applying changes:", error)
      setErrorMessage("Failed to apply changes")
    }
  }

  return (
    <div className="max-w-xl w-full mx-auto p-4 flex flex-col gap-4">
      {errorMessage && <div className="text-red-400">{errorMessage}</div>}
      {successMessage && <div className="text-green-400">{successMessage}</div>}
      <button
        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
        onClick={handleSelectDirectory}
      >
        Select Project Directory
      </button>
      {directoryHandle && <p>Selected directory: {directoryHandle.name}</p>}
      <div className="flex flex-col">
        <label className="mb-2 font-bold">Paste XML here:</label>
        <textarea
          className="border bg-secondary text-secondary-foreground p-2 h-64 w-full rounded-md"
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          placeholder="Paste the <code_changes>...</code_changes> XML here"
        />
      </div>
      <button
        className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 transition-colors"
        onClick={handleApply}
      >
        Apply
      </button>
    </div>
  )
}