/**
 * @file Type definitions for file data and template state in SuperPromptor
 * @description 
 * This file defines the core TypeScript interfaces used to manage file data and application state 
 * for the SuperPromptor web application. These types are critical for handling file uploads, 
 * template management, and state management across components.
 * 
 * Key features:
 * - FileData: Represents individual file metadata and contents
 * - TemplateState: Manages the template string and associated file selections
 * 
 * @dependencies
 * - None (standalone TypeScript interfaces)
 * 
 * @notes
 * - File contents are stored as strings to simplify clipboard output generation
 * - The files Map in TemplateState uses a string key (tag ID) to associate files with specific <file> tags
 * - Interfaces are preferred over type aliases per project rules
 */

export interface FileData {
  /**
   * The relative path of the file (e.g., "folder/subfolder/file.txt").
   * Relative to the selected root folder if applicable.
   */
  path: string;

  /**
   * The size of the file in bytes.
   * Used for displaying file size (e.g., "1.2 MB") and triggering large file warnings (>10MB).
   */
  size: number;

  /**
   * The contents of the file as a string.
   * Loaded client-side using FileReader or similar APIs during file selection.
   */
  contents: string;
}

export interface TemplateState {
  /**
   * The raw markdown template string uploaded by the user.
   * Contains <file> tags to be replaced with file contents in the output.
   */
  template: string;

  /**
   * A Map associating each <file> tag's unique ID with an array of selected files.
   * Key: A generated ID for each <file> tag instance (e.g., "file-1", "file-2").
   * Value: Array of FileData objects representing the selected files for that tag.
   */
  files: Map<string, FileData[]>;
}