"use client"

/**
 * @file Template Display component for SuperPromptor
 * @description
 * This client-side component handles the upload and markdown rendering of the template
 * in the SuperPromptor application. It provides a file input for uploading `.md` files,
 * reads and stores the template content in state, and renders the template as markdown
 * using react-markdown. It replaces `<file>` tags with FileSelector buttons for file selection.
 *
 * Key features:
 * - File input restricted to `.md` files with validation
 * - Reads and stores template content in state
 * - Renders template as markdown with custom remark plugin to handle `<file>` tags
 * - Replaces `<file>` tags with interactive FileSelector buttons
 * - Displays a placeholder if no template is uploaded
 *
 * @dependencies
 * - react: For state management (useState) and event handling
 * - react-markdown: For rendering markdown content
 * - unist-util-visit: For traversing and modifying the markdown AST
 * - unist: For base Node type definition
 * - mdast: For markdown-specific AST node types (Parent, Text)
 * - ./file-selector: Client component for file selection buttons
 * - @/types: For FileSelectorNode type
 *
 * @notes
 * - Uses a custom remark plugin to replace `<file>` tags with custom 'fileSelector' nodes
 * - Each `<file>` tag is assigned a unique ID for state management
 * - Added logging to debug `<file>` tag replacement issues
 * - Uses explicit typing for components prop to resolve TypeScript error with custom 'fileSelector'
 */

import { useState } from "react"
import ReactMarkdown, { Components } from 'react-markdown'
import { visit, type BuildVisitor } from 'unist-util-visit'
import { Node } from 'unist'
import { Parent, Text } from 'mdast'
import FileSelector from './file-selector'
import { FileSelectorNode } from '@/types'

/**
 * Creates a remark plugin to replace `<file>` tags with custom 'fileSelector' nodes.
 * Each `<file>` tag is assigned a unique ID using a closure-based counter.
 * @returns () => (tree: Node) => void - The plugin function that transforms the AST
 */
function createFileTagPlugin() {
  let counter = 0;
  return () => (tree: Node) => {
    console.log('Original AST:', JSON.stringify(tree, null, 2));
    // Define the visitor with proper typing for Text nodes
    const visitor: BuildVisitor<Node, 'text'> = (
      node: Text,
      index: number | undefined,
      parent: Parent | undefined
    ) => {
      // Ensure parent and index are defined before proceeding
      if (parent && index !== undefined && node.value.includes('<file>')) {
        console.log(`Found <file> in node: "${node.value}"`);
        const parts = node.value.split('<file>');
        const newNodes: (Text | FileSelectorNode)[] = [];

        parts.forEach((part: string, i: number) => {
          // Add non-empty text parts as text nodes
          if (part) {
            newNodes.push({ type: 'text', value: part } as Text);
          }
          // Add a fileSelector node before each <file> tag, except after the last part
          if (i < parts.length - 1) {
            counter++;
            const id = `file-${counter}`;
            newNodes.push({ type: 'fileSelector', id });
            console.log(`Replaced <file> with fileSelector node, id: ${id}`);
          }
        });
        // Replace the original text node with the new nodes; cast as any due to mdast strictness
        (parent.children as any).splice(index, 1, ...newNodes);
      }
    };

    // Apply the visitor to all 'text' nodes in the tree
    visit(tree, 'text', visitor);
    console.log('Transformed AST:', JSON.stringify(tree, null, 2));
  };
}

export default function TemplateDisplay() {
  // State to hold the uploaded template content
  const [template, setTemplate] = useState<string>("");

  /**
   * Handles file selection, reads the content of a .md file, and updates state.
   * @param event - The change event from the file input
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file extension (.md)
      if (file.name.endsWith(".md")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          // Safely cast result as string and update state
          const content = e.target?.result as string;
          setTemplate(content);
        };
        reader.readAsText(file);
      } else {
        alert("Please upload a .md file");
        event.target.value = ""; // Reset input to allow re-selection
      }
    }
  };

  // Create the remark plugin instance
  const fileTagPlugin = createFileTagPlugin();

  // Define custom components with explicit typing to include fileSelector
  const components: Components & { fileSelector?: React.FC<{ id: string }> } = {
    fileSelector: ({ id }) => <FileSelector id={id} />,
  };

  return (
    <div className="p-4">
      {/* Accessible label for file input */}
      <label htmlFor="template-upload" className="block mb-2 text-gray-700 dark:text-gray-300">
        Upload your markdown template:
      </label>

      {/* File input restricted to .md files */}
      <input
        id="template-upload"
        type="file"
        accept=".md"
        onChange={handleFileChange}
        className="mb-4 text-gray-700 dark:text-gray-300"
      />

      {/* Conditional rendering based on template state */}
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