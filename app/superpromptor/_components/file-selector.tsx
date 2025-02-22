/**
 * @file File Selector component for SuperPromptor
 * @description
 * This client-side component handles file and folder selection for the SuperPromptor application.
 * It renders as a button within the markdown template where `<file>` tags were replaced, allowing
 * users to select multiple files or a folder. Once selected, it displays the list of files with
 * options to remove them and add more.
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
 * - Folder selection uses window.showDirectoryPicker (tree view TBD)
 * - File contents are read using FileReader; streaming may be added later
 * - Checks API availability with fallbacks for unsupported browsers
 * - Notifies parent of file changes via onFilesSelected prop
 */

"use client"

import { useState, useEffect } from "react"
import { Plus, X } from "lucide-react"
import type { FileData } from "@/types"

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

/**
 * Helper function to read file contents as text
 * @param file - File object to read
 * @returns Promise resolving to the file contents as string
 */
async function readFileContents(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('File content is not a string'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export default function FileSelector({ id, onFilesSelected }: FileSelectorProps) {
  const [files, setFiles] = useState<FileData[]>([])
  const [rootFolder, setRootFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  // Update parent when files change, with stable onFilesSelected
  useEffect(() => {
    console.log(`FileSelector ${id} notifying parent with files:`, files)
    onFilesSelected(files)
  }, [files, id, onFilesSelected]) // onFilesSelected is memoized in parent

  /**
   * Handles the selection of multiple files using window.showOpenFilePicker.
   * Reads file contents and updates the state with new files.
   */
  const handleSelectFiles = async () => {
    if (!window.showOpenFilePicker) {
      alert("File System Access API is not supported in this browser. Please use a supported browser like Chrome or Edge.")
      return
    }
    try {
      const fileHandles = await window.showOpenFilePicker({ multiple: true })
      const newFiles = await Promise.all(
        fileHandles.map(async (handle) => {
          const file = await handle.getFile()
          const contents = await readFileContents(file)
          const fileData: FileData = {
            path: file.name, // Will be updated to relative path in future steps
            size: file.size,
            contents,
          }
          console.log(`Selected file: ${file.name}, size: ${file.size} bytes`)
          return fileData
        })
      )
      const updatedFiles = [...files, ...newFiles]
      setFiles(updatedFiles)
      console.log(`Files updated for selector ${id}:`, updatedFiles)
    } catch (error) {
      console.error(`Error selecting files for selector ${id}:`, error)
      alert("Failed to select files. Please try again or check console for details.")
    }
  }

  /**
   * Handles the selection of a folder using window.showDirectoryPicker.
   * Sets the root folder and prepares for tree view display.
   * (Tree view logic to be implemented in a future step)
   */
  const handleSelectFolder = async () => {
    if (!window.showDirectoryPicker) {
      alert("File System Access API is not supported in this browser. Please use a supported browser like Chrome or Edge.")
      return
    }
    try {
      const folderHandle = await window.showDirectoryPicker()
      setRootFolder(folderHandle)
      console.log(`Folder selected for selector ${id}:`, folderHandle.name)
      // TODO: Implement tree view to select files within the folder
      alert("Folder selection is not fully implemented yet. Please select files directly for now.")
    } catch (error) {
      console.error(`Error selecting folder for selector ${id}:`, error)
      alert("Failed to select folder. Please try again or check console for details.")
    }
  }

  /**
   * Removes a file from the selected files list.
   * @param index - The index of the file to remove
   */
  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    console.log(`Removed file at index ${index} for selector ${id}. New files:`, updatedFiles)
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
    <div className="inline-block relative">
      {/* Button to trigger selection menu */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        {files.length > 0 ? "Change Files" : "Select Files"}
      </button>

      {/* Dropdown menu for selection options */}
      {showMenu && (
        <div className="absolute z-10 bg-white dark:bg-gray-800 shadow-md rounded mt-2">
          <button
            onClick={() => {
              handleSelectFiles()
              setShowMenu(false)
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Select Files
          </button>
          <button
            onClick={() => {
              handleSelectFolder()
              setShowMenu(false)
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              <li key={`${file.path}-${index}`} className="flex items-center justify-between mb-1">
                <span className="text-gray-700 dark:text-gray-300">
                  {file.path} ({formatFileSize(file.size)})
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                  aria-label={`Remove ${file.path}`}
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
                // TODO: Reopen tree view for folder (future step)
                console.log(`Reopen tree view for folder for selector ${id}`)
                alert("Folder tree view is not implemented yet. Please select files directly.")
              } else {
                handleSelectFiles()
              }
            }}
            className="mt-2 text-blue-500 hover:text-blue-700 transition-colors"
            aria-label="Add more files"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  )
}