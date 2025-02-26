## Project Name
SuperPromptor

## Project Description
SuperPromptor is a web application designed to streamline the process of preparing prompts for large language model (LLM) chatboxes. It enables developers to upload a markdown (.md) template containing `<file>` tags, replace these tags with contents from selected files or folders via an intuitive interface, and copy the combined output to the clipboard for use in LLM chatboxes. The app focuses on simplicity, displaying the template as rendered markdown with file upload buttons, without in-app editing.

## Target Audience
All software developers who use templates and need to insert file contents into prompts for LLM chatboxes, regardless of their specific domain or use case.

## Desired Features
### Template Management
- [ ] Upload markdown template files (.md)
    - [ ] Restrict to `.md` files initially, with potential future support for other text files
- [ ] Display the template with full markdown rendering (e.g., headers, lists, code blocks), non-editable
- [ ] Provide a “Refresh” button
    - [ ] Reload the template from the user’s local filesystem if updated
    - [ ] Clear all uploaded files on refresh
    - [ ] Show a confirmation prompt before refreshing (e.g., “Are you sure? This will clear all uploaded files.”)
- [ ] Provide a “Remove” button
    - [ ] Clear the uploaded template and all associated files, resetting the app to the initial state
    - [ ] Display a disappearing alert saying “Template Removed” after removal

### Tag Replacement
- [ ] Recognize `<file>` tags in the template and replace each with a button in the UI
- [ ] Set button text to “Select Files” initially, changing to “Change Files” after files are selected
    - [ ] Revert to “Select Files” if files are cleared (e.g., via refresh or remove)
- [ ] Display an interactive list of selected files below each button
    - [ ] Show each file’s relative path (e.g., `folder/subfolder/file.txt`) and size (e.g., `1.2 MB`)
    - [ ] Include a small remove button next to each file to delete it from the list
    - [ ] Add a plus sign button at the bottom of the list to reopen the folder tree and add more files

### File Handling
- [ ] Support selection of multiple files or entire folders via button clicks
- [ ] For folder selections, display a toggleable tree view below the button
    - [ ] Allow users to select specific files or subfolders within the chosen root folder
    - [ ] Reopen the tree view via the plus sign, starting fresh from the root folder (if previously set)
- [ ] Insert file contents in the output with the format: `-- relative/file/path/filename --\n[file contents]\n` repeated for each file
    - [ ] Use the selected folder as the root for determining relative paths
- [ ] Show a warning for files >10MB, asking users to confirm inclusion
- [ ] No restrictions on file types for upload

### Output
- [ ] Provide a “Copy Contents To Clipboard” button
- [ ] Combine the template and file contents into a single output
    - [ ] Insert file contents at `<file>` tag locations with no additional preprocessing
    - [ ] Include all selected file contents in the clipboard output
    - [ ] If no `<file>` tags exist, copy the template as-is
- [ ] Copy the combined content to the clipboard as plain text

### Navigation
- [ ] Include a navigation panel with two options:
    - [ ] “SuperPromptor” (links to the homepage with the app functionality)
    - [ ] “How To Use” (links to a page explaining how the app works)
- [ ] Create a “How To Use” page
    - [ ] Provide a simple explanation of uploading a template, selecting files, and copying the output

## Design Requests
- [ ] Minimal layout for the homepage
    - [ ] Header displaying “SuperPromptor”
    - [ ] Box for uploading the markdown template
    - [ ] Readable, rendered template display area with `<file>` buttons and interactive file lists below each
    - [ ] “Refresh” and “Remove” buttons near the template display
    - [ ] “Copy Contents To Clipboard” button at the bottom
- [ ] Intuitive and responsive toggleable tree view for folder selection, collapsible below each `<file>` button
- [ ] Simple, clean design for the “How To Use” page
- [ ] Disappearing “Template Removed” alert with a subtle fade-out effect

## Other Notes
- Ensure efficient handling of large files (>10MB) with the warning mechanism
- Test browser compatibility for file system access and clipboard functionality
- Consider performance optimization for rendering large templates or processing many files
- Future expansion: potentially support other text file formats beyond `.md`