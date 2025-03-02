"use server"

import fs from 'fs'
import path from 'path'
import ModeSelector from "./superpromptor/_components/mode-selector"

export default async function Home() {
  const templatesDir = path.join(process.cwd(), 'starter-templates')
  const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.md'))
  const starterTemplates = templateFiles.map(file => file.replace('.md', ''))

  return <ModeSelector starterTemplates={starterTemplates} />
}