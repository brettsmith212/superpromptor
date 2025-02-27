/**
 * @file Centralized instructions for SuperPromptor
 * @description
 * This file defines markdown strings for Template Editor and XML Parser instructions,
 * centralizing them for reuse across the application (e.g., in TemplateDisplay and XmlParser).
 * It ensures that updates to instructions propagate consistently.
 *
 * Key features:
 * - Exports TemplateEditorMarkdown for the Template Prompt Editor tab
 * - Exports XMLParserMarkdown for the XML Code Parser tab
 *
 * @notes
 * - Content is sourced from app/how-to-use/page.tsx for consistency
 * - Plain strings are used to leverage ReactMarkdown for rendering
 */

export const TemplateEditorMarkdown = `
SuperPromptor is a tool designed to help you create prompts for large language models (LLMs) by combining a markdown template with file contents.

## Steps to Use SuperPromptor

1. **Upload a Markdown Template**
   - Click on the "Upload Template" button on the main page.
   - Select a \`.md\` file from your local file system.
   - The markdown template should contain \`<superpromptor-file>\` tags where you want to insert file contents.

2. **Select Files or Folders**
   - For each \`<superpromptor-file>\` tag in your markdown template, a "Select Files" button will appear.
   - Click on "Select Files" to choose files or folders to include.
   - You can select multiple files or an entire folder.
   - If you select a folder, a tree view will allow you to choose specific files or subfolders.

3. **Review and Adjust Selections**
   - Below each "Select Files" button, you'll see a list of selected files with their relative paths and sizes.
   - You can remove individual files by clicking the remove button next to each file.
   - Use the plus sign to add more files if needed.

4. **Copy the Output**
   - Once you've selected all necessary files, click the "Copy Contents To Clipboard" button.
   - This will combine the template with the selected file contents and copy the result to your clipboard.
   - You can then paste this into your LLM chatbox.

## Additional Features

- **Refresh Template**: If you've updated your template file, click "Refresh" to reload it.
- **Remove Template**: Click "Remove" to clear the uploaded template and reset the app.

## Notes

- Only \`.md\` files are supported for templates.
- Files larger than 10MB will trigger a warning; you can choose to include or exclude them.
- The output format for each file is: \`-- relative/path/filename --\\n[file contents]\\n\`
`

export const XMLParserMarkdown = `
## Steps to Use XML Code Parser

1. **How to Add XML Instructions to a Template**
   - To add XML instructions to a template (source: McKay Wrigley of https://www.jointakeoff.com/prompts)

XML Section:
   - Do not get lazy. Always output the full code in the XML section.
   - Enclose this entire section in a markdown codeblock
   - Include all of the changed files
   - Specify each file operation with CREATE, UPDATE, or DELETE
   - For CREATE or UPDATE operations, include the full file code
   - Include the full file path (relative to the project directory, good: app/page.tsx, bad: /Users/username/Desktop/projects/new-chat-template/app/page.tsx)
   - Enclose the code with ![CDATA[__CODE HERE__]]
   - Use the following XML structure:

\`\`\`xml
<code_changes>
  <changed_files>
    <file>
      <file_operation>__FILE OPERATION HERE__</file_operation>
      <file_path>__FILE PATH HERE__</file_path>
      <file_code><![CDATA[
__FULL FILE CODE HERE__
]]></file_code>
    </file>
    __REMAINING FILES HERE__
  </changed_files>
</code_changes>
\`\`\`

1. **Select a Project Directory**
   - The directory chosen will be where the code changes are inserted.

2. **Paste XML Code Changes**
   - Paste the XML code changes into the textarea.

3. **Apply Changes**
   - Click "Apply Changes" to insert the changes into the selected project directory.
`