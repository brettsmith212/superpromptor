/**
 * @file File Selector component for SuperPromptor
 * @description
 * This client-side component handles file and folder selection for the SuperPromptor application.
 * It replaces `<file>` tags in the markdown template with a button that allows users to select
 * multiple files or a folder. Once selected, it displays the list of files with options to remove
 * them and add more.
 *
 * Key features:
 * - Button to select multiple files or a folder via a dropdown menu
 * - Displays selected files with their names and sizes
 * - Allows removing individual files from the selection
 * - Plus sign button to add more files (reopens file picker or tree view)
 * - Updates button text to "Change Files" after selection
 *
 * @dependencies
 * - react: For state management (useState) and event handling
 * - lucide-react: For icons (Plus, X)
 * - @/types: For FileData type
 *
 * @notes
 * - File selection uses window.showOpenFilePicker for multiple files
 * - Folder selection uses window.showDirectoryPicker
 * - Tree view for folder selection will be implemented in a future step
 * - File contents are read using FileReader for now; streaming may be added later
 * - Checks API availability with fallbacks for unsupported browsers
 */

"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { FileData } from "@/types"

interface FileSelectorProps {
  /**
   * A unique identifier for this file selector instance,
   * corresponding to a specific `<file>` tag in the template.
   */
  id: string

  /**
   * Callback to pass selected files to the parent component.
   * @param files - Array of selected FileData objects
   */
  onFilesSelected: (files: FileData[]) => void
}

export default function FileSelector({ id, onFilesSelected }: FileSelectorProps) {
  const [files, setFiles] = useState<FileData[]>([])
  const [rootFolder, setRootFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  /**
   * Handles the selection of multiple files using window.showOpenFilePicker.
   * Reads file contents and updates the state with new files.
   */
  const handleSelectFiles = async () => {
    if (!window.showOpenFilePicker) {
      alert("File System Access API is not supported in this browser.");
      return;
    }
    try {
      const fileHandles = await window.showOpenFilePicker({ multiple: true })
      const newFiles = await Promise.all(
        fileHandles.map(async (handle) => {
          const file = await handle.getFile()
          const contents = await readFileContents(file)
          return {
            path: file.name,
            size: file.size,
            contents,
          }
        })
      )
      const updatedFiles = [...files, ...newFiles]
      setFiles(updatedFiles)
      onFilesSelected(updatedFiles)
    } catch (error) {
      console.error("Error selecting files:", error)
      alert("Failed to select files. See console for details.");
    }
  }

  /**
   * Handles the selection of a folder using window.showDirectoryPicker.
   * Sets the root folder and prepares for tree view display.
   * (Tree view logic to be implemented in a future step)
   */
  const handleSelectFolder = async () => {
    if (!window.showDirectoryPicker) {
      alert("File System Access API is not supported in this browser.");
      return;
    }
    try {
      const folderHandle = await window.showDirectoryPicker()
      setRootFolder(folderHandle)
      console.log("Folder selected:", folderHandle.name)
      // TODO: Implement tree view to select files within the folder
    } catch (error) {
      console.error("Error selecting folder:", error)
      alert("Failed to select folder. See console for details.");
    }
  }

  /**
   * Reads the contents of a file using FileReader.
   * @param file - The File object to read
   * @returns Promise<string> - The file contents as a string
   */
  const readFileContents = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  }

  /**
   * Removes a file from the selected files list.
   * @param index - The index of the file to remove
   */
  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onFilesSelected(updatedFiles)
  }

  /**
   * Formats the file size in a human-readable format (e.g., 1.2 MB).
   * @param size - The file size in bytes
   * @returns string - The formatted file size
   */
  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="inline-block">
      {/* Button to trigger selection menu */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {files.length > 0 ? "Change Files" : "Select Files"}
      </button>

      {/* Dropdown menu for selection options */}
      {showMenu && (
        <div className="absolute bg-white shadow-md rounded mt-2">
          <button
            onClick={() => {
              handleSelectFiles()
              setShowMenu(false)
            }}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            Select Files
          </button>
          <button
            onClick={() => {
              handleSelectFolder()
              setShowMenu(false)
            }}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            Select Folder
          </button>
        </div>
      )}

      {/* List of selected files */}
      {files.length > 0 && (
        <div className="mt-2">
          <ul className="list-disc pl-5">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between">
                <span>{file.path} ({formatFileSize(file.size)})</span>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
          {/* Plus sign to add more files */}
          <button
            onClick={() => {
              if (rootFolder) {
                // TODO: Reopen tree view for folder
                console.log("Reopen tree view for folder")
              } else {
                handleSelectFiles()
              }
            }}
            className="mt-2 text-blue-500 hover:text-blue-700"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  )
}