/**
 * @file Type definitions for file data and template state in SuperPromptor
 * @description 
 * This file defines the core TypeScript interfaces used to manage file data, application state,
 * and custom markdown nodes for the SuperPromptor web application. These types are critical for
 * handling file uploads, template management, state management, and custom AST processing across components.
 * 
 * Key features:
 * - FileData: Represents individual file metadata and contents
 * - FileDataWithHandle: Extends FileData with a handle for refreshing file contents
 * - TemplateState: Manages the template string and associated file selections
 * - FileSelectorNode: Custom node type for <superpromptor-file> tags in the markdown AST
 * 
 * @dependencies
 * - unist: For base Node type extended by FileSelectorNode
 * 
 * @notes
 * - File contents are stored as strings to simplify clipboard output generation
 * - The files Map in TemplateState uses a string key (tag ID) to associate files with specific <superpromptor-file> tags
 * - FileSelectorNode extends Node for compatibility with unist-util-visit and react-markdown
 * - Interfaces are preferred over type aliases per project rules
 * - FileDataWithHandle includes an optional handle, null for fallback selections
 */

import { Node } from 'unist'

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

export interface FileDataWithHandle extends FileData {
  /**
   * The FileSystemFileHandle associated with this file, used for refreshing contents.
   * Null if the file was selected via fallback (<input>) or handle is unavailable.
   */
  handle: FileSystemFileHandle | null;
}

export interface TemplateState {
  /**
   * The raw markdown template string uploaded by the user.
   * Contains <superpromptor-file> tags to be replaced with file contents in the output.
   */
  template: string;

  /**
   * A Map associating each <superpromptor-file> tag's unique ID with an array of selected files.
   * Key: A generated ID for each <superpromptor-file> tag instance (e.g., "file-1", "file-2").
   * Value: Array of FileData objects representing the selected files for that tag.
   */
  files: Map<string, FileData[]>;
}

export interface FileSelectorNode extends Node {
  /**
   * The type identifier for this custom node, set to 'fileSelector'.
   */
  type: 'fileSelector';

  /**
   * A unique identifier for this file selector instance,
   * corresponding to a specific `<superpromptor-file>` tag in the template (e.g., "file-1").
   */
  id: string;
}