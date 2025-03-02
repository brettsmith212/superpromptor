/**
 * @file Type definitions for file data and template state in SuperPromptor
 * @description 
 * This file defines the core TypeScript interfaces used to manage file data, application state,
 * and custom markdown nodes for the SuperPromptor web application.
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
  path: string;
  size: number;
  contents: string;
}

export interface FileDataWithHandle extends FileData {
  handle: FileSystemFileHandle | null;
}

export type Segment =
  | { type: "markdown"; content: string }
  | { type: "fileSelector"; id: string }
  | { type: "input"; id: string }

export interface TemplateState {
  template: string;
  files: Map<string, FileData[]>;
}