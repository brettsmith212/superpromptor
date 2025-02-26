# SuperPromptor Technical Specification

## 1. System Overview
- **Core Purpose and Value Proposition**: SuperPromptor is a web application that simplifies the creation of prompts for large language models (LLMs) by allowing developers to upload markdown templates with `<file>` tags, replace them with file contents via an intuitive UI, and copy the result to the clipboard. It eliminates manual file content insertion, enhancing productivity.
- **Key Workflows**:
  1. User uploads a `.md` template.
  2. App renders the template as markdown, replacing `<file>` tags with buttons.
  3. User selects files/folders, previews selections, and adjusts as needed.
  4. User copies the combined output to the clipboard.
- **System Architecture**:
  - Frontend: Next.js with server components for initial rendering and client components for interactivity.
  - No backend persistence; relies on browser File System Access API and Clipboard API.
  - Tech Stack: Next.js, Tailwind CSS, Shadcn UI, Framer Motion.

## 2. Project Structure
- **Breakdown**:
  - `app/`:
    - `superpromptor/page.tsx`: Main app page (server component).
    - `how-to-use/page.tsx`: Static instructional page (server component).
    - `layout.tsx`: Root layout with navigation (server component).
  - `_components/`:
    - `template-display.tsx`: Renders markdown and file buttons (client component).
    - `file-selector.tsx`: File/folder selection UI (client component).
    - `navigation-panel.tsx`: Sidebar navigation (client component).
  - `components/`:
    - `alert.tsx`: Reusable disappearing alert (client component).
  - `types/`:
    - `file-types.ts`: Interfaces for file data.
  - `public/`:
    - Static assets (e.g., icons).
- **Organization Rules**:
  - Use `@` imports (e.g., `@/_components/template-display`).
  - Kebab-case filenames (e.g., `file-selector.tsx`).

## 3. Feature Specification

### 3.1 Template Management
- **User Story**: As a developer, I want to upload a markdown template and manage it easily so I can focus on prompt creation.
- **Requirements**: Upload `.md` files, render as markdown, provide refresh/remove options.
- **Implementation Steps**:
  1. Create a file input in `superpromptor/page.tsx` accepting `.md` files.
  2. Use `react-markdown` to render the template in `template-display.tsx`.
  3. Add “Refresh” button that reloads the template file and clears selections (with confirmation dialog).
  4. Add “Remove” button that resets the app state and shows a disappearing alert.
- **Error Handling and Edge Cases**:
  - Non-`.md` file uploaded: Show error message.
  - File not found on refresh: Display “File not found” alert.
  - No template uploaded: Show placeholder text.

### 3.2 Tag Replacement
- **User Story**: As a developer, I want `<file>` tags replaced with interactive buttons so I can easily insert file contents.
- **Requirements**: Replace `<file>` tags with buttons, update button text dynamically, show file lists.
- **Implementation Steps**:
  1. Parse markdown in `template-display.tsx` to identify `<file>` tags.
  2. Replace each tag with a `file-selector.tsx` instance, passing a unique ID.
  3. Set button text to “Select Files” initially, changing to “Change Files” post-selection.
  4. Below each button, render a list of selected files with remove buttons and a plus sign to add more.
- **Error Handling and Edge Cases**:
  - Duplicate `<file>` tags: Treat as separate instances with unique IDs.
  - No files selected: Keep button as “Select Files”.

### 3.3 File Handling
- **User Story**: As a developer, I want to select files or folders and preview them so I can ensure the right content is included.
- **Requirements**: Support multiple file/folder selection, show tree view for folders, format output with relative paths.
- **Implementation Steps**:
  1. In `file-selector.tsx`, use `window.showOpenFilePicker` for file selection and `window.showDirectoryPicker` for folders.
  2. For folders, render a collapsible tree view using a recursive component.
  3. Store selected files with relative paths (relative to root folder if set).
  4. Format output as `-- relative/path/filename --\n[contents]\n`.
  5. Show warning dialog for files >10MB with confirm/cancel options.
- **Error Handling and Edge Cases**:
  - File access denied: Show error message.
  - Large file rejection: Reset selection for that tag.
  - Browser lacks File System Access API: Fallback to `<input type="file">`.

### 3.4 Output
- **User Story**: As a developer, I want to copy the combined template and file contents to the clipboard with one click.
- **Requirements**: Combine template and file contents, copy as plain text.
- **Implementation Steps**:
  1. In `superpromptor/page.tsx`, add a “Copy Contents To Clipboard” button.
  2. On click, compile the template by replacing each `<file>` tag with formatted file contents.
  3. Use `navigator.clipboard.writeText` to copy the result.
- **Error Handling and Edge Cases**:
  - No files selected: Copy template as-is.
  - Clipboard permission denied: Show error alert.

### 3.5 Navigation
- **User Story**: As a developer, I want easy navigation and instructions so I can use the app effectively.
- **Requirements**: Sidebar with two links, static “How To Use” page.
- **Implementation Steps**:
  1. In `layout.tsx`, include `navigation-panel.tsx` with links to `/superpromptor` and `/how-to-use`.
  2. Create `how-to-use/page.tsx` with static markdown content explaining the app.
- **Error Handling and Edge Cases**:
  - N/A (static content).

## 4. Database Schema
- **Note**: No persistent database required; all state is managed client-side.

## 5. Server Actions
### 5.1 Database Actions
- N/A (no database).

### 5.2 Other Actions
- **File Handling**:
  - **Description**: Read file contents client-side.
  - **Procedure**: Use `FileReader` API or stream reading for large files.
  - **Error Handling**: Catch file read errors and display messages.
- **Clipboard Integration**:
  - **Description**: Copy text to clipboard.
  - **Procedure**: `navigator.clipboard.writeText(output)`.
  - **Error Handling**: Handle permission errors.

## 6. Design System
### 6.1 Visual Style
- **Color Palette**:
  - Background: `#ffffff` (light) / `#0a0a0a` (dark).
  - Foreground: `#171717` (light) / `#ededed` (dark).
  - Accent: `#3b82f6` (blue).
- **Typography**:
  - Font: Geist Sans (body), Geist Mono (code).
  - Sizes: 16px (base), 24px (headers).
- **Component Styling**: Use Tailwind classes (e.g., `bg-gray-100`, `text-blue-500`).
- **Spacing**: 8px grid (e.g., `p-4`, `gap-4`).

### 6.2 Core Components
- **Layout Structure**:
  ```tsx
  <div className="min-h-screen flex">
    <NavigationPanel />
    <main className="flex-1 p-8">{children}</main>
  </div>
```

- **Navigation Patterns**: Vertical sidebar with hover effects.

- **Shared Components**:
    - Alert: message: string, fades out after 3s.



- **Interactive States**: Hover (hover:bg-gray-200), Disabled (opacity-50).

## 7. Component Architecture



### 7.1 Server Components



- **Data Fetching**: Preload template if passed as prop (future feature).

- **Suspense**: Wrap template-display in <Suspense> for async file loading.

- **Props**:
```tsx
interface SuperPromptorPageProps {
  initialTemplate?: string;
}
```

### 7.2 Client Components



- **State Management**: useReducer for template and file selections.

- **Event Handlers**: File upload, button clicks.

```tsx
interface FileSelectorProps {
  id: string;
  onFilesSelected: (files: FileData[]) => void;
}
```

## 8. Authentication & Authorization



- N/A (public app).


## 9. Data Flow



- **Server/Client**: Server passes initial template (if any) to client via props.

State Management:

```tsx
const [state, dispatch] = useReducer(reducer, {
  template: "",
  files: new Map<string, FileData[]>(), // Keyed by <file> tag ID
});
```

## 10. Stripe Integration



- N/A (no payments).


## 11. PostHog Analytics



- **Optional Strategy**: Track template_uploaded, files_selected, output_copied.

- **Implementation**: Add PostHog SDK and event triggers (future feature).

## 12. Testing



- **Unit Tests (Jest)**:
    - Test template parsing: expect(parseTemplate("<file>")).toContain("button").

    - Test file formatting: expect(formatFileContent(file)).toMatch(/--.*--\n/);.



- **E2E Tests (Playwright)**:
    - Flow: Upload template → Select files → Copy output.

    - Verify alert on remove.
