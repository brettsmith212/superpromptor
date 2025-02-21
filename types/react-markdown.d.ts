/**
 * @file Type augmentation for react-markdown in SuperPromptor
 * @description
 * This file extends the type definitions of the react-markdown library to include
 * custom node types used in the SuperPromptor application, specifically the 'fileSelector'
 * node introduced for replacing `<file>` tags in markdown templates.
 *
 * Key features:
 * - Extends the Components interface to recognize 'fileSelector' as a valid key
 * - Ensures TypeScript accepts the custom renderer for 'fileSelector' nodes
 *
 * @dependencies
 * - react-markdown: The library being augmented
 *
 * @notes
 * - Necessary to prevent TypeScript errors when using custom nodes in the components prop
 * - Follows TypeScript module augmentation pattern
 * - Matches the FileSelector component props ({ id: string })
 */

import 'react-markdown'

declare module 'react-markdown' {
  interface Components {
    /**
     * Custom renderer for the 'fileSelector' node introduced by the remark plugin.
     * @param id - The unique identifier for the file selector instance
     */
    fileSelector?: React.FC<{ id: string }>;
  }
}