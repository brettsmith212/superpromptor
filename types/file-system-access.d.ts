/**
 * @file Type definitions for File System Access API in SuperPromptor
 * @description
 * This file extends the Window interface to include methods from the File System Access API,
 * specifically showOpenFilePicker and showDirectoryPicker, to enable type-safe usage in the
 * SuperPromptor application. These APIs are used in the FileSelector component for file and
 * folder selection.
 *
 * Key features:
 * - Adds showOpenFilePicker with options for multiple file selection
 * - Adds showDirectoryPicker for folder selection
 *
 * @notes
 * - These definitions match the File System Access API spec as of Feb 2025
 * - Used to resolve TypeScript error ts(2339) in file-selector.tsx
 * - Browser support is limited (Chrome/Edge yes, Firefox no), handled at runtime
 */

interface FilePickerOptions {
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}

interface FileSystemFileHandle {
  getFile(): Promise<File>;
  // Add more methods if needed in the future
}

interface FileSystemDirectoryHandle {
  name: string;
  // Add more methods if needed in the future
}

declare global {
  interface Window {
    /**
     * Opens a file picker dialog allowing the user to select one or multiple files.
     * @param options - Configuration for the file picker (e.g., allow multiple selections)
     * @returns Promise resolving to an array of FileSystemFileHandle objects
     */
    showOpenFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>;

    /**
     * Opens a directory picker dialog allowing the user to select a folder.
     * @returns Promise resolving to a FileSystemDirectoryHandle object
     */
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
}