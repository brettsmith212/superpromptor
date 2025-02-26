# Implementation Plan

## Project Setup
- [x] Step 1: Initialize Project Structure and Dependencies
  - **Task**: Set up the Next.js project structure per `project_rules`, install required dependencies (e.g., `react-markdown`, `framer-motion`, `lucide-react`), and configure Tailwind globals.css with the specified design system.
  - **Files**:
    - `package.json`: Add dependencies (`react-markdown`, `framer-motion`, `lucide-react`, `shadcn-ui`).
    - `app/globals.css`: Update with design system colors (`#ffffff`, `#171717`, `#3b82f6`) and fonts (Inter).
    - `tsconfig.json`: Ensure `@/*` alias is correctly configured.
    - `app/layout.tsx`: Create basic server-side root layout (empty for now).
    - `app/superpromptor/page.tsx`: Empty server page.
    - `app/how-to-use/page.tsx`: Empty server page.
  - **Step Dependencies**: None
  - **User Instructions**: Run `npm install` after updating `package.json`.

- [x] Step 2: Define File and State Types
  - **Task**: Create TypeScript interfaces for file data and app state, exported in `types/index.ts`, following the `project_rules` type conventions.
  - **Files**:
    - `types/file-types.ts`: Define `FileData` (path, size, contents), `TemplateState` (template string, files Map).
    - `types/index.ts`: Export `* from "./file-types"`.
  - **Step Dependencies**: Step 1
  - **User Instructions**: None

## Layout and Navigation
- [x] Step 3: Implement Root Layout and Navigation Panel
  - **Task**: Create a server-side root layout with a client-side navigation panel (sidebar) linking to `/superpromptor` and `/how-to-use`, styled with Tailwind.
  - **Files**:
    - `app/layout.tsx`: Server component with `<NavigationPanel />` and `children`.
    - `_components/navigation-panel.tsx`: Client component with sidebar layout and links.
  - **Step Dependencies**: Step 1
  - **User Instructions**: None

- [x] Step 4: Create "How To Use" Page
  - **Task**: Implement a static server-side page with markdown content explaining how to use SuperPromptor (upload template, select files, copy output).
  - **Files**:
    - `app/how-to-use/page.tsx`: Server component with static markdown rendered via `react-markdown`.
  - **Step Dependencies**: Step 3
  - **User Instructions**: None

## Core SuperPromptor Features
- [x] Step 5: Implement Template Upload and Display (Server Side)
  - **Task**: Add a file input for `.md` templates in the SuperPromptor page, passing the initial template content to a client-side display component.
  - **Files**:
    - `app/superpromptor/page.tsx`: Server component with file input and `<TemplateDisplay />`.
    - `_components/template-display.tsx`: Basic client component to receive and display template (placeholder).
  - **Step Dependencies**: Step 2, Step 3
  - **User Instructions**: None

- [x] Step 6: Render Markdown and Replace `<superpromptor-file>` Tags
  - **Task**: Enhance `template-display.tsx` to render the template as markdown using `react-markdown`, replacing `<superpromptor-file>` tags with `file-selector.tsx` buttons.
  - **Files**:
    - `_components/template-display.tsx`: Parse template, render markdown, inject `<FileSelector />`.
    - `_components/file-selector.tsx`: Client component with “Select Files” button (placeholder).
  - **Step Dependencies**: Step 5
  - **User Instructions**: None

- [x] Step 7: Implement File Selection Logic
  - **Task**: Add file/folder selection to `file-selector.tsx` using `window.showOpenFilePicker` and `window.showDirectoryPicker`, storing selected files in state.
  - **Files**:
    - `_components/file-selector.tsx`: Update with file picker logic, pass selected files via `onFilesSelected`.
  - **Step Dependencies**: Step 6
  - **User Instructions**: None

- [x] Step 8: Add File List Display and Removal
  - **Task**: Display selected files below each `file-selector.tsx` button with relative paths, sizes, and remove buttons; update button text to “Change Files” post-selection.
  - **Files**:
    - `_components/file-selector.tsx`: Add file list UI with remove functionality.
  - **Step Dependencies**: Step 7
  - **User Instructions**: None

- [x] Step 9: Implement Folder Tree View
  - **Task**: Add a toggleable tree view for folder selections in `file-selector.tsx`, allowing specific file/subfolder selection within the root folder.
  - **Files**:
    - `_components/file-selector.tsx`: Add recursive tree view component and toggle logic.
  - **Step Dependencies**: Step 8
  - **User Instructions**: None

- [x] Step 10: Handle Large File Warnings
  - **Task**: Add a >10MB file size warning dialog in `file-selector.tsx`, requiring user confirmation before inclusion.
  - **Files**:
    - `_components/file-selector.tsx`: Implement warning dialog using Shadcn UI.
  - **Step Dependencies**: Step 9
  - **User Instructions**: None

- [x] Step 11: Implement Refresh and Remove Buttons
  - **Task**: Add “Refresh” (reloads template, clears files) and “Remove” (resets app) buttons to the SuperPromptor page, with confirmation dialogs and a disappearing “Template Removed” alert.
  - **Files**:
    - `app/superpromptor/page.tsx`: Add buttons and pass handlers to `template-display.tsx`.
    - `_components/template-display.tsx`: Handle refresh/remove logic.
    - `components/alert.tsx`: Create reusable disappearing alert component.
  - **Step Dependencies**: Step 6
  - **User Instructions**: None

- [x] Step 12: Generate and Copy Output to Clipboard
  - **Task**: Add a “Copy Contents To Clipboard” button that combines the template and file contents (formatted as `-- path --\n[contents]\n`), copying to the clipboard using `navigator.clipboard`.
  - **Files**:
    - `app/superpromptor/page.tsx`: Add button and pass output handler.
    - `_components/template-display.tsx`: Compile output and copy to clipboard.
  - **Step Dependencies**: Step 11
  - **User Instructions**: None

## Client-Side Interactivity
- [x] Step 13: Add State Management with useReducer
  - **Task**: Implement `useReducer` in `template-display.tsx` to manage template content and file selections, keyed by `<superpromptor-file>` tag IDs.
  - **Files**:
    - `_components/template-display.tsx`: Add reducer and dispatch for state management.
  - **Step Dependencies**: Step 12
  - **User Instructions**: None

- [x] Step 14: Add Error Handling and Edge Cases
  - **Task**: Implement error handling for non-`.md` uploads, file access issues, and clipboard permission denied; display errors via `alert.tsx`.
  - **Files**:
    - `app/superpromptor/page.tsx`: Validate `.md` uploads.
    - `_components/file-selector.tsx`: Handle file access errors.
    - `_components/template-display.tsx`: Handle clipboard errors.
    - `components/alert.tsx`: Update to support error messages.
  - **Step Dependencies**: Step 13
  - **User Instructions**: None

---

### Summary of Approach and Key Considerations

**Overall Approach**: The plan starts with project setup and type definitions, establishes the app structure with layout and navigation, and incrementally builds the SuperPromptor page—starting with template management, then file handling, and finally output generation. Client-side interactivity and polish (animations, error handling) are added last, followed by testing. This ensures a logical progression where each step builds on a stable foundation.

**Key Considerations**:
- **Browser Compatibility**: The File System Access API may not work in all browsers (e.g., older versions); fallbacks are included in Step 14.
- **Performance**: Large file handling is optimized with warnings (Step 10) and streaming reads where possible.
- **State Management**: `useReducer` centralizes state, simplifying debugging and scalability (Step 13).
- **Modularity**: Components are split between `_components` (route-specific) and `components` (shared) per `project_rules`.
- **Testing**: Both unit and E2E tests ensure reliability and usability.

This plan covers all specified features, adheres to the tech stack and rules, and is broken into 17 atomic steps, each modifying a small set of files for AI-driven implementation. Once approved, it’s ready for the code generation phase.