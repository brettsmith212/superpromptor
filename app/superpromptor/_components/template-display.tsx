/**
 * @file Template Display component for SuperPromptor
 * @description
 * This client-side component manages the upload, markdown rendering, and file selection
 * workflow for the SuperPromptor application. It provides a file input for uploading `.md`
 * templates, renders the template as markdown using react-markdown, and replaces `<file>`
 * tags with interactive FileSelector buttons. It also tracks selected files for each tag.
 *
 * Key features:
 * - File input restricted to `.md` files with validation
 * - Renders template as markdown with a custom remark plugin to handle `<file>` tags
 * - Replaces `<file>` tags with FileSelector buttons, each with a unique ID
 * - Tracks selected files per `<file>` tag in a Map for later output generation
 * - Displays a placeholder if no template is uploaded
 *
 * @dependencies
 * - react: For state management (useState) and event handling
 * - react-markdown: For rendering markdown content
 * - unist-util-visit: For traversing and modifying the markdown AST
 * - unist: For base Node type definition
 * - mdast: For markdown-specific AST node types (Parent, Text)
 * - ./file-selector: Client component for file selection buttons
 * - @/types: For FileSelectorNode and FileData types
 *
 * @notes
 * - Uses a custom remark plugin to replace `<file>` tags with 'fileSelector' nodes
 * - Each `<file>` tag gets a unique ID for state management
 * - File selections are stored in a Map keyed by tag ID for centralized management
 * - Logging is included to debug AST transformations
 * - Assumes FileSelector handles its own file selection UI
 */

"use client"

import { useState } from "react"
import ReactMarkdown, { Components } from 'react-markdown'
import { visit, type BuildVisitor } from 'unist-util-visit'
import { Node } from 'unist'
import { Parent, Text } from 'mdast'
import FileSelector from './file-selector'
import { FileSelectorNode, FileData } from '@/types'

/**
 * Creates a remark plugin to replace `<file>` tags with custom 'fileSelector' nodes.
 * Each `<file>` tag is assigned a unique ID using a closure-based counter.
 * @returns () => (tree: Node) => void - The plugin function that transforms the AST
 */
function createFileTagPlugin() {
  let counter = 0;
  return () => (tree: Node) => {
    console.log('Original AST:', JSON.stringify(tree, null, 2));
    const visitor: BuildVisitor<Node, 'text'> = (
      node: Text,
      index: number | undefined,
      parent: Parent | undefined
    ) => {
      if (parent && index !== undefined && node.value.includes('<file>')) {
        console.log(`Found <file> in node: "${node.value}"`);
        const parts = node.value.split('<file>');
        const newNodes: (Text | FileSelectorNode)[] = [];

        parts.forEach((part: string, i: number) => {
          if (part) {
            newNodes.push({ type: 'text', value: part } as Text);
          }
          if (i < parts.length - 1) {
            counter++;
            const id = `file-${counter}`;
            newNodes.push({ type: 'fileSelector', id });
            console.log(`Replaced <file> with fileSelector node, id: ${id}`);
          }
        });
        (parent.children as any).splice(index, 1, ...newNodes);
      }
    };

    visit(tree, 'text', visitor);
    console.log('Transformed AST:', JSON.stringify(tree, null, 2));
  };
}

export default function TemplateDisplay() {
  const [template, setTemplate] = useState<string>("");
  const [files, setFiles] = useState<Map<string, FileData[]>>(new Map());

  /**
   * Handles file selection from a FileSelector instance.
   * Updates the files Map with the selected files for the given tag ID.
   * @param tagId - The unique ID of the `<file>` tag
   * @param selectedFiles - Array of selected FileData objects
   */
  const handleFilesSelected = (tagId: string, selectedFiles: FileData[]) => {
    setFiles((prevFiles) => {
      const newFiles = new Map(prevFiles);
      newFiles.set(tagId, selectedFiles);
      return newFiles;
    });
  };

  /**
   * Handles file selection, reads the content of a .md file, and updates state.
   * @param event - The change event from the file input
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith(".md")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setTemplate(content);
          setFiles(new Map()); // Reset files when a new template is uploaded
        };
        reader.readAsText(file);
      } else {
        alert("Please upload a .md file");
        event.target.value = "";
      }
    }
  };

  const fileTagPlugin = createFileTagPlugin();

  // Define custom components with typing that matches FileSelectorProps
  const components: Components & { fileSelector?: React.FC<{ id: string }> } = {
    fileSelector: ({ id }) => (
      <FileSelector
        id={id}
        onFilesSelected={(selectedFiles) => handleFilesSelected(id, selectedFiles)}
      />
    ),
  };

  return (
    <div className="p-4">
      <label htmlFor="template-upload" className="block mb-2 text-gray-700 dark:text-gray-300">
        Upload your markdown template:
      </label>

      <input
        id="template-upload"
        type="file"
        accept=".md"
        onChange={handleFileChange}
        className="mb-4 text-gray-700 dark:text-gray-300"
      />

      {template ? (
        <ReactMarkdown
          remarkPlugins={[fileTagPlugin]}
          components={components}
        >
          {template}
        </ReactMarkdown>
      ) : (
        <p className="text-gray-500">Upload a template to get started</p>
      )}
    </div>
  );
}