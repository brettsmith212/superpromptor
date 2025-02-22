/**
 * @file Type declarations for the File System Access API in SuperPromptor
 * @description
 * This file extends the Window interface to include modern File System Access API methods
 * and interfaces used in the SuperPromptor application for file and folder selection.
 * It provides type safety for FileSelector's file handling features.
 *
 * Key features:
 * - Defines showOpenFilePicker and showDirectoryPicker on Window
 * - Specifies FileSystemHandle, FileSystemFileHandle, and FileSystemDirectoryHandle interfaces
 * - Includes entries() method on FileSystemDirectoryHandle for directory traversal
 *
 * @notes
 * - Matches File System Access API spec as of February 2025
 * - Browser support is limited (Chrome/Edge yes, Firefox no), handled at runtime
 * - Updated to include entries() to resolve ts(2339) error in file-selector.tsx
 */

interface FileSystemHandle {
  kind: "file" | "directory"
  name: string
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: "file"
  getFile(): Promise<File>
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: "directory"
  name: string
  /**
   * Returns an async iterable of directory entries, each a [name, handle] tuple.
   * Used to recursively traverse folder contents in the tree view.
   * @returns AsyncIterableIterator of [string, FileSystemHandle] pairs
   */
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
}

interface ShowOpenFilePickerOptions {
  multiple?: boolean
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
  excludeAcceptAllOption?: boolean
}

interface Window {
  /**
   * Opens a file picker dialog allowing the user to select one or multiple files.
   * @param options - Configuration for the file picker (e.g., allow multiple selections)
   * @returns Promise resolving to an array of FileSystemFileHandle objects
   */
  showOpenFilePicker(options?: ShowOpenFilePickerOptions): Promise<FileSystemFileHandle[]>

  /**
   * Opens a directory picker dialog allowing the user to select a folder.
   * @returns Promise resolving to a FileSystemDirectoryHandle object
   */
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>
}