/**
 * @file File Selector component for SuperPromptor
 * @description
 * This client-side component handles file and folder selection for the SuperPromptor application.
 * It renders as a button within the markdown template where `<file>` tags are replaced, allowing
 * users to select multiple files or a folder. For folder selections, it displays a toggleable tree
 * view to select specific files, showing selected files with options to remove them and add more.
 * It includes logic to warn users about large files (>10MB) and ask for confirmation before inclusion.
 *
 * Key features:
 * - Button with dropdown to select multiple files or a folder
 * - Toggleable tree view for folder selections with recursive folder navigation
 * - Displays selected files with relative paths and sizes
 * - Allows removing individual files from the selection
 * - Plus sign button to reopen the tree view or file picker
 * - Updates button text to "Change Files" after selection
 * - Shows confirmation dialog for files larger than 10MB before inclusion
 *
 * @dependencies
 * - react: For state management (useState, useCallback, useMemo, useEffect) and event handling
 * - lucide-react: For icons (Plus, X)
 * - @/types: For FileData type
 * - @/components/ui/dialog: For confirmation dialog (Shadcn UI)
 * - @/components/ui/button: For dialog buttons (Shadcn UI)
 *
 * @notes
 * - Uses File System Access API (showOpenFilePicker, showDirectoryPicker) with browser compatibility checks
 * - Tree view is recursive, fetching folder contents on expansion
 * - Paths are relative to the root folder when set; otherwise, use file names
 * - Allows multiple files with the same path (e.g., direct vs. folder selection); removal by path may remove all instances
 * - Error handling includes alerts for file reading and folder entry failures
 * - Large file warnings are handled via a confirmation dialog using Shadcn UI components
 */

"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Plus, X } from "lucide-react"
import type { FileData } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/**
 * Props for the FileSelector component
 */
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
 * Props for the FileItem component
 */
interface FileItemProps {
  handle: FileSystemFileHandle
  path: string
  selectedPaths: Set<string>
  addFile: (fileData: FileData) => void
  removeFile: (path: string) => void
  confirmLargeFile: (file: File) => Promise<boolean>
}

/**
 * Props for the FolderTreeView component
 */
interface FolderTreeViewProps {
  directoryHandle: FileSystemDirectoryHandle
  currentPath: string
  selectedPaths: Set<string>
  addFile: (fileData: FileData) => void
  removeFile: (path: string) => void
  isRoot?: boolean
  level?: number
  confirmLargeFile: (file: File) => Promise<boolean>
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

/**
 * Component to render individual files in the tree view with checkboxes
 */
const FileItem: React.FC<FileItemProps> = ({
  handle,
  path,
  selectedPaths,
  addFile,
  removeFile,
  confirmLargeFile,
}) => {
  const isSelected = selectedPaths.has(path)

  /**
   * Handles checkbox changes, checking file size and reading contents only if confirmed
   */
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    if (checked) {
      try {
        const file = await handle.getFile()
        let include = true
        if (file.size > 10 * 1024 * 1024) {
          include = await confirmLargeFile(file)
        }
        if (include) {
          const contents = await readFileContents(file)
          addFile({ path, size: file.size, contents })
        } else {
          // If not included, ensure the checkbox is unchecked
          e.target.checked = false
        }
      } catch (error) {
        console.error(`Error processing file ${path}:`, error)
        alert(`Failed to process file ${path}. Please try again.`)
      }
    } else {
      removeFile(path)
    }
  }

  return (
    <li>
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleChange}
          className="mr-2"
        />
        {handle.name}
      </label>
    </li>
  )
}

/**
 * Recursive component to render the folder tree view
 */
const FolderTreeView: React.FC<FolderTreeViewProps> = ({
  directoryHandle,
  currentPath,
  selectedPaths,
  addFile,
  removeFile,
  isRoot = false,
  level = 0,
  confirmLargeFile,
}) => {
  const [isExpanded, setIsExpanded] = useState(isRoot)
  const [entries, setEntries] = useState<Array<[string, FileSystemHandle]>>([])

  /**
   * Fetches folder entries when expanded
   */
  useEffect(() => {
    if (isExpanded) {
      const fetchEntries = async () => {
        try {
          const newEntries = []
          for await (const entry of directoryHandle.entries()) {
            newEntries.push(entry)
          }
          // Sort: folders first, then files, alphabetically
          newEntries.sort((a, b) => {
            if (a[1].kind === "directory" && b[1].kind === "file") return -1
            if (a[1].kind === "file" && b[1].kind === "directory") return 1
            return a[0].localeCompare(b[0])
          })
          setEntries(newEntries)
        } catch (error) {
          console.error(`Error fetching entries for ${directoryHandle.name}:`, error)
          alert(`Failed to fetch folder contents for ${directoryHandle.name}. Please try again.`)
        }
      }
      fetchEntries()
    }
  }, [isExpanded, directoryHandle])

  return (
    <div style={{ paddingLeft: isRoot ? 0 : 20 }}>
      {!isRoot && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-500 hover:text-blue-700"
          >
            {isExpanded ? "-" : "+"} {directoryHandle.name}
          </button>
          {isExpanded && entries.length > 0 && (
            <ul className="list-none">
              {entries.map(([name, handle]) =>
                handle.kind === "directory" ? (
                  <li key={name}>
                    <FolderTreeView
                      directoryHandle={handle as FileSystemDirectoryHandle}
                      currentPath={currentPath + name + "/"}
                      selectedPaths={selectedPaths}
                      addFile={addFile}
                      removeFile={removeFile}
                      level={level + 1}
                      confirmLargeFile={confirmLargeFile}
                    />
                  </li>
                ) : (
                  <FileItem
                    key={name}
                    handle={handle as FileSystemFileHandle}
                    path={currentPath + name}
                    selectedPaths={selectedPaths}
                    addFile={addFile}
                    removeFile={removeFile}
                    confirmLargeFile={confirmLargeFile}
                  />
                )
              )}
            </ul>
          )}
        </>
      )}
      {isRoot && entries.length > 0 && (
        <ul className="list-none">
          {entries.map(([name, handle]) =>
            handle.kind === "directory" ? (
              <li key={name}>
                <FolderTreeView
                  directoryHandle={handle as FileSystemDirectoryHandle}
                  currentPath={currentPath + name + "/"}
                  selectedPaths={selectedPaths}
                  addFile={addFile}
                  removeFile={removeFile}
                  level={level + 1}
                  confirmLargeFile={confirmLargeFile}
                />
              </li>
            ) : (
              <FileItem
                key={name}
                handle={handle as FileSystemFileHandle}
                path={currentPath + name}
                selectedPaths={selectedPaths}
                addFile={addFile}
                removeFile={removeFile}
                confirmLargeFile={confirmLargeFile}
              />
            )
          )}
        </ul>
      )}
    </div>
  )
}

/**
 * Main FileSelector component
 */
export default function FileSelector({ id, onFilesSelected }: FileSelectorProps) {
  const [files, setFiles] = useState<FileData[]>([])
  const [rootFolder, setRootFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showTreeView, setShowTreeView] = useState(false)
  const [showingConfirmation, setShowingConfirmation] = useState(false)
  const [confirmFile, setConfirmFile] = useState<File | null>(null)
  const [resolveConfirm, setResolveConfirm] = useState<((value: boolean) => void) | null>(null)

  /**
   * Updates both local state and parent with new files
   */
  const updateFiles = useCallback(
    (newFiles: FileData[]) => {
      setFiles(newFiles)
      onFilesSelected(newFiles)
    },
    [onFilesSelected]
  )

  /**
   * Adds a file to the selection, allowing duplicates
   */
  const addFile = useCallback(
    (fileData: FileData) => {
      const newFiles = [...files, fileData]
      updateFiles(newFiles)
    },
    [files, updateFiles]
  )

  /**
   * Removes all files with the specified path
   * Note: May remove multiple instances if paths are duplicated (e.g., direct vs. folder selection)
   */
  const removeFile = useCallback(
    (path: string) => {
      const newFiles = files.filter((f) => f.path !== path)
      updateFiles(newFiles)
    },
    [files, updateFiles]
  )

  /**
   * Memoized set of selected file paths for efficient lookup
   */
  const selectedPaths = useMemo(() => new Set(files.map((f) => f.path)), [files])

  /**
   * Prompts user to confirm inclusion of a large file (>10MB)
   * @param file - The file to confirm
   * @returns Promise resolving to true if included, false otherwise
   */
  const confirmLargeFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmFile(file)
      setShowingConfirmation(true)
      setResolveConfirm(() => resolve)
    })
  }

  /**
   * Handles multiple file selection using showOpenFilePicker
   */
  const handleSelectFiles = async () => {
    if (!window.showOpenFilePicker) {
      alert(
        "File System Access API is not supported in this browser. Please use a supported browser like Chrome or Edge."
      )
      return
    }
    try {
      const fileHandles = await window.showOpenFilePicker({ multiple: true })
      for (const handle of fileHandles) {
        const file = await handle.getFile()
        let include = true
        if (file.size > 10 * 1024 * 1024) {
          include = await confirmLargeFile(file)
        }
        if (include) {
          const contents = await readFileContents(file)
          const path = file.name // For direct selection, use file name
          addFile({ path, size: file.size, contents })
        }
      }
    } catch (error) {
      console.error(`Error selecting files for selector ${id}:`, error)
      alert("Failed to select files. Please try again or check console for details.")
    }
  }

  /**
   * Handles folder selection, setting root folder and showing tree view
   */
  const handleSelectFolder = async () => {
    if (!window.showDirectoryPicker) {
      alert(
        "File System Access API is not supported in this browser. Please use a supported browser like Chrome or Edge."
      )
      return
    }
    try {
      const folderHandle = await window.showDirectoryPicker()
      setRootFolder(folderHandle)
      setShowTreeView(true)
      console.log(`Folder selected for selector ${id}:`, folderHandle.name)
    } catch (error) {
      console.error(`Error selecting folder for selector ${id}:`, error)
      alert("Failed to select folder. Please try again or check console for details.")
    }
  }

  /**
   * Removes a file by index from the displayed list
   */
  const removeFileByIndex = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    updateFiles(updatedFiles)
    console.log(`Removed file at index ${index} for selector ${id}. New files:`, updatedFiles)
  }

  /**
   * Formats file size in a human-readable format
   */
  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="inline-block relative">
      {/* Selection button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        {files.length > 0 ? "Change Files" : "Select Files"}
      </button>

      {/* Dropdown menu */}
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

      {/* Tree view */}
      {showTreeView && rootFolder && (
        <div className="mt-2 p-4 border rounded">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Select files from {rootFolder.name}</h3>
            <button
              onClick={() => setShowTreeView(false)}
              className="text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
          <FolderTreeView
            directoryHandle={rootFolder}
            currentPath=""
            selectedPaths={selectedPaths}
            addFile={addFile}
            removeFile={removeFile}
            isRoot={true}
            confirmLargeFile={confirmLargeFile}
          />
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-2">
          <ul className="list-disc pl-5">
            {files.map((file, index) => (
              <li
                key={`${file.path}-${index}`}
                className="flex items-center justify-between mb-1"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {file.path} ({formatFileSize(file.size)})
                </span>
                <button
                  onClick={() => removeFileByIndex(index)}
                  className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                  aria-label={`Remove ${file.path}`}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              if (rootFolder) {
                setShowTreeView(true)
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

      {/* Confirmation dialog for large files */}
      {showingConfirmation && confirmFile && (
        <Dialog
          open={showingConfirmation}
          onOpenChange={(open) => {
            if (!open && resolveConfirm) {
              resolveConfirm(false)
              setResolveConfirm(null)
            }
            setShowingConfirmation(open)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Large File Inclusion</DialogTitle>
            </DialogHeader>
            <p>
              The file {confirmFile.name} is {formatFileSize(confirmFile.size)} in size, which is
              larger than 10MB. Do you want to include it?
            </p>
            <DialogFooter>
              <Button
                onClick={() => {
                  resolveConfirm?.(true)
                  setResolveConfirm(null)
                  setShowingConfirmation(false)
                }}
              >
                Include
              </Button>
              <Button
                onClick={() => {
                  resolveConfirm?.(false)
                  setResolveConfirm(null)
                  setShowingConfirmation(false)
                }}
              >
                Exclude
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}