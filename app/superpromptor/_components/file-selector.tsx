/**
 * @file File Selector component for SuperPromptor
 * @description
 * This client-side component handles file and folder selection for the SuperPromptor application.
 * It renders as a button within the markdown template where `<superpromptor-file>` tags are replaced, allowing
 * users to select multiple files or a folder. For folder selections, it displays a toggleable tree
 * view to select specific files, showing selected files with options to remove them and add more.
 * It includes logic to warn users about large files (>10MB) and ask for confirmation before inclusion.
 * It now passes file handles to the parent for refresh functionality and ensures folder-level checkboxes
 * correctly select/deselection all files recursively without requiring folder expansion.
 *
 * Key features:
 * - Button with dropdown to select multiple files or a folder
 * - Toggleable tree view for folder selections with recursive folder navigation
 * - Folder-level checkbox to select/deselect all files recursively without prior expansion
 * - Displays selected files with relative paths and sizes
 * - Allows removing individual files from the selection
 * - Plus sign button to reopen the tree view or file picker
 * - Updates button text to "Change Files" after selection
 * - Shows confirmation dialog for files larger than 10MB before inclusion
 * - Passes FileSystemFileHandle with FileData to parent for refreshing contents
 * - Handles file access errors gracefully
 * - Adds a "Clear Files" button to reset all selected files
 *
 * @dependencies
 * - react: For state management (useState, useCallback, useMemo, useEffect) and event handling
 * - lucide-react: For icons (Plus, X)
 * - @/types: For FileData and FileDataWithHandle types
 * - @/components/ui/dialog: For confirmation dialog (Shadcn UI)
 * - @/components/ui/button: For dialog buttons (Shadcn UI)
 *
 * @notes
 * - Uses File System Access API (showOpenFilePicker, showDirectoryPicker) with browser compatibility checks
 * - Tree view is recursive, fetching folder contents on expansion
 * - Paths are relative to the root folder when set; otherwise, use file names
 * - Allows multiple files with the same path (e.g., direct vs. folder selection); removal by path may remove all instances
 * - Error handling silently ignores AbortError for user cancellations, alerts for other issues
 * - Large file warnings are handled via a confirmation dialog using Shadcn UI components
 * - Handles are null for files selected via input fallback, limiting refresh capability in those cases
 * - Folder checkboxes now correctly handle recursive selection/deselection without requiring "+" click
 */

"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Plus, X } from "lucide-react"
import type { FileData, FileDataWithHandle } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/**
 * Props for the FileSelector component
 */
interface FileSelectorProps {
  id: string
  onFilesSelected: (files: FileDataWithHandle[]) => void
}

/**
 * Props for the FileItem component
 */
interface FileItemProps {
  handle: FileSystemFileHandle
  path: string
  selectedPaths: Set<string>
  addFile: (fileData: FileDataWithHandle) => void
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
  updateFiles: (newFiles: FileDataWithHandle[]) => void
  files: FileDataWithHandle[]
  isRoot?: boolean
  level?: number
  confirmLargeFile: (file: File) => Promise<boolean>
}

/**
 * Helper function to read file contents as text
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
 * Recursively collects all file handles within a directory
 */
async function getAllFilesInDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  currentPath: string
): Promise<{ handle: FileSystemFileHandle; path: string }[]> {
  const files: { handle: FileSystemFileHandle; path: string }[] = []
  for await (const [name, handle] of directoryHandle.entries()) {
    if (handle.kind === "file") {
      files.push({ handle: handle as FileSystemFileHandle, path: currentPath + name })
    } else if (handle.kind === "directory") {
      const subFiles = await getAllFilesInDirectory(
        handle as FileSystemDirectoryHandle,
        currentPath + name + "/"
      )
      files.push(...subFiles)
    }
  }
  return files
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
          addFile({ path, size: file.size, contents, handle })
        } else {
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
 * Recursive component to render the folder tree view with folder-level checkboxes
 */
const FolderTreeView: React.FC<FolderTreeViewProps> = ({
  directoryHandle,
  currentPath,
  selectedPaths,
  updateFiles,
  files,
  isRoot = false,
  level = 0,
  confirmLargeFile,
}) => {
  const [isExpanded, setIsExpanded] = useState(isRoot)
  const [entries, setEntries] = useState<Array<[string, FileSystemHandle]>>([])
  const [allFiles, setAllFiles] = useState<{ handle: FileSystemFileHandle; path: string }[]>([])

  // Fetch all files on mount, regardless of expansion
  useEffect(() => {
    const fetchAllFiles = async () => {
      try {
        const filesInDir = await getAllFilesInDirectory(directoryHandle, currentPath)
        setAllFiles(filesInDir)
      } catch (error) {
        console.error(`Error fetching all files for ${directoryHandle.name}:`, error)
        alert(`Failed to fetch files for ${directoryHandle.name}. Some operations may not work.`)
      }
    }
    fetchAllFiles()
  }, [directoryHandle, currentPath])

  // Fetch visible entries only when expanded
  useEffect(() => {
    if (isExpanded) {
      const fetchEntries = async () => {
        try {
          const newEntries = []
          for await (const entry of directoryHandle.entries()) {
            newEntries.push(entry)
          }
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

  const folderCheckboxState = useMemo(() => {
    if (allFiles.length === 0) return { checked: false, indeterminate: false }
    const allSelected = allFiles.every((f) => selectedPaths.has(f.path))
    const someSelected = allFiles.some((f) => selectedPaths.has(f.path))
    return {
      checked: allSelected,
      indeterminate: someSelected && !allSelected,
    }
  }, [allFiles, selectedPaths])

  const handleFolderCheckboxChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked
      const currentFiles = [...files]

      if (checked) {
        const newFilesToAdd: FileDataWithHandle[] = []
        for (const { handle, path } of allFiles) {
          if (!selectedPaths.has(path)) {
            try {
              const file = await handle.getFile()
              let include = true
              if (file.size > 10 * 1024 * 1024) {
                include = await confirmLargeFile(file)
              }
              if (include) {
                const contents = await readFileContents(file)
                newFilesToAdd.push({ path, size: file.size, contents, handle })
              }
            } catch (error) {
              console.error(`Error processing file ${path}:`, error)
              alert(`Failed to process file ${path}. Continuing with remaining files.`)
            }
          }
        }
        if (newFilesToAdd.length > 0) {
          updateFiles([...currentFiles, ...newFilesToAdd])
        }
      } else {
        const pathsToKeep = currentFiles.filter(
          (f) => !allFiles.some((af) => af.path === f.path)
        )
        updateFiles(pathsToKeep)
      }
    },
    [allFiles, files, selectedPaths, updateFiles, confirmLargeFile]
  )

  return (
    <div style={{ paddingLeft: isRoot ? 0 : 20 }}>
      {!isRoot && (
        <>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={folderCheckboxState.checked}
              ref={(el) => {
                if (el) el.indeterminate = folderCheckboxState.indeterminate
              }}
              onChange={handleFolderCheckboxChange}
              className="mr-2"
            />
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-500 hover:text-blue-700"
            >
              {isExpanded ? "-" : "+"} {directoryHandle.name}
            </button>
          </div>
          {isExpanded && entries.length > 0 && (
            <ul className="list-none">
              {entries.map(([name, handle]) =>
                handle.kind === "directory" ? (
                  <li key={name}>
                    <FolderTreeView
                      directoryHandle={handle as FileSystemDirectoryHandle}
                      currentPath={currentPath + name + "/"}
                      selectedPaths={selectedPaths}
                      updateFiles={updateFiles}
                      files={files}
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
                    addFile={(fileData) => updateFiles([...files, fileData])}
                    removeFile={(path) => updateFiles(files.filter((f) => f.path !== path))}
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
                  updateFiles={updateFiles}
                  files={files}
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
                addFile={(fileData) => updateFiles([...files, fileData])}
                removeFile={(path) => updateFiles(files.filter((f) => f.path !== path))}
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
  const [files, setFiles] = useState<FileDataWithHandle[]>([])
  const [rootFolder, setRootFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showTreeView, setShowTreeView] = useState(false)
  const [showingConfirmation, setShowingConfirmation] = useState(false)
  const [confirmFile, setConfirmFile] = useState<File | null>(null)
  const [resolveConfirm, setResolveConfirm] = useState<((value: boolean) => void) | null>(null)

  const updateFiles = useCallback(
    (newFiles: FileDataWithHandle[]) => {
      setFiles(newFiles)
      onFilesSelected(newFiles)
    },
    [onFilesSelected]
  )

  const clearFiles = useCallback(() => {
    setFiles([])
    setRootFolder(null)
    setShowTreeView(false)
    onFilesSelected([])
  }, [onFilesSelected])

  const selectedPaths = useMemo(() => new Set(files.map((f) => f.path)), [files])

  const confirmLargeFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmFile(file)
      setShowingConfirmation(true)
      setResolveConfirm(() => resolve)
    })
  }

  const handleSelectFiles = async () => {
    if (!window.showOpenFilePicker) {
      alert(
        "File System Access API is not supported in this browser. Please use a supported browser like Chrome or Edge."
      )
      return
    }
    try {
      const fileHandles = await window.showOpenFilePicker({ multiple: true })
      const newFiles: FileDataWithHandle[] = []
      for (const handle of fileHandles) {
        const file = await handle.getFile()
        let include = true
        if (file.size > 10 * 1024 * 1024) {
          include = await confirmLargeFile(file)
        }
        if (include) {
          const contents = await readFileContents(file)
          const path = file.name
          newFiles.push({ path, size: file.size, contents, handle })
        }
      }
      if (newFiles.length > 0) {
        updateFiles([...files, ...newFiles])
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        return
      }
      console.error(`Error selecting files for selector ${id}:`, error)
      alert("Failed to select files. Please try again or check console for details.")
    }
  }

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
    } catch (error: any) {
      if (error.name === "AbortError") {
        return
      }
      console.error(`Error selecting folder for selector ${id}:`, error)
      alert("Failed to select folder. Please try again or check console for details.")
    }
  }

  const removeFileByIndex = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    updateFiles(updatedFiles)
    console.log(`Removed file at index ${index} for selector ${id}. New files:`, updatedFiles)
  }

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="inline-block relative">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          {files.length > 0 ? "Change Files" : "Select Files"}
        </button>
        {files.length > 0 && (
          <button
            onClick={clearFiles}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Clear Files
          </button>
        )}
      </div>

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
            updateFiles={updateFiles}
            files={files}
            isRoot={true}
            confirmLargeFile={confirmLargeFile}
          />
        </div>
      )}

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