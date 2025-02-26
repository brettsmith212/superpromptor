/**
 * @file Mode Selector component for SuperPromptor
 * @description
 * This client-side component manages the toggle between the Template Prompt Editor
 * and the XML Code Parser. It uses shadcn's Tabs component to switch between the two modes.
 * The Template Prompt Editor is rendered using the TemplateDisplay component, while
 * the XML Code Parser is rendered using the XmlParser component.
 *
 * Key features:
 * - Uses useState to manage the current mode ("template" or "xml")
 * - Renders Tabs with two options: "Template Prompt Editor" and "XML Code Parser"
 * - Renders both TemplateDisplay and XmlParser, hiding the inactive one with CSS
 * - Ensures that both components remain mounted to preserve their state
 *
 * @dependencies
 * - react: For useState hook
 * - @/components/ui/tabs: shadcn's Tabs component for the toggle UI
 * - ./template-display: The TemplateDisplay component for the editor
 * - ./xml-parser: The XmlParser component for the XML parser
 *
 * @notes
 * - Marked as "use client" for client-side state management
 * - Assumes shadcn's Tabs component is set up in the project
 * - Both tab contents are always rendered but only one is visible to preserve state
 */

"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TemplateDisplay from "./template-display"
import XmlParser from "./xml-parser"

export default function ModeSelector() {
  const [mode, setMode] = useState("template")
  const triggerClassName = "data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=inactive]:hover:border-b-2 data-[state=inactive]:hover:border-primary/50"

  return (
    <div>
      <Tabs value={mode} onValueChange={setMode} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="template" className={triggerClassName}>
            Template Prompt Editor
          </TabsTrigger>
          <TabsTrigger value="xml" className={triggerClassName}>
            XML Code Parser
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className={mode === "template" ? "" : "hidden"}>
        <TemplateDisplay />
      </div>
      <div className={mode === "xml" ? "" : "hidden"}>
        <XmlParser />
      </div>
    </div>
  )
}