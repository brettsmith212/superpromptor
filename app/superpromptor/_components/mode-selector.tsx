"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TemplateDisplay from "./template-display"
import XmlParser from "./xml-parser"

export default function ModeSelector({ starterTemplates }: { starterTemplates: string[] }) {
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
        <TemplateDisplay starterTemplates={starterTemplates} />
      </div>
      <div className={mode === "xml" ? "" : "hidden"}>
        <XmlParser />
      </div>
    </div>
  )
}