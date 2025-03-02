/**
 * @file API route to serve starter template contents
 * @description
 * This server-side API route handles GET requests to fetch the content of starter markdown templates
 * stored in the `/starter-templates` directory. It reads the requested template file and returns its
 * content as plain text.
 *
 * Key features:
 * - Serves markdown files from `/starter-templates` based on the `name` parameter
 * - Returns 404 if the template is not found
 *
 * @notes
 * - Assumes templates are stored with `.md` extension
 * - Uses synchronous file reading for simplicity
 */
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const name = (await params).name
  const templatesDir = path.join(process.cwd(), 'starter-templates')
  const filePath = path.join(templatesDir, `${name}.md`)

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch {
    return new NextResponse('Template not found', { status: 404 })
  }
}