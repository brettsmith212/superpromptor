/**
 * @file Mode Selector component for SuperPromptor
 * @description
 * This client-side component manages the toggle between the Template Prompt Editor
 * and the XML Code Parser. It uses shadcn's Tabs component to switch between the two modes.
 * The Template Prompt Editor is rendered using the TemplateDisplay component, while
 * the XML Code Parser is currently a placeholder.
 *
 * Key features:
 * - Uses useState to manage the current mode ("template" or "xml")
 * - Renders Tabs with two options: "Template Prompt Editor" and "XML Code Parser"
 * - Conditionally renders TemplateDisplay or a placeholder paragraph based on the selected mode
 *
 * @dependencies
 * - react: For useState hook
 * - @/components/ui/tabs: shadcn's Tabs component for the toggle UI
 * - ./template-display: The TemplateDisplay component for the editor
 *
 * @notes
 * - Marked as "use client" for client-side state management
 * - Assumes shadcn's Tabs component is set up in the project
 * - The XML Parser is a placeholder and will be implemented later
 */

"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import TemplateDisplay from "./template-display"

export default function ModeSelector() {
  const [mode, setMode] = useState("template")

  return (
    <Tabs value={mode} onValueChange={setMode} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="template">Template Prompt Editor</TabsTrigger>
        <TabsTrigger value="xml">XML Code Parser</TabsTrigger>
      </TabsList>
      <TabsContent value="template">
        <TemplateDisplay />
      </TabsContent>
      <TabsContent value="xml">
        <p>XML Parser</p>
      </TabsContent>
    </Tabs>
  )
}