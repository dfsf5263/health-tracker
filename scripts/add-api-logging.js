#!/usr/bin/env node
// Script to add withApiLogging wrapper to all API route files

const fs = require('fs')
const path = require('path')

const ROUTES_DIR = path.join(__dirname, '../src/app/api')
const IMPORT_LINE = "import { withApiLogging } from '@/lib/middleware/with-api-logging'"

const SKIP_FILES = [
  path.join(ROUTES_DIR, 'auth', '[...all]', 'route.ts'),
]

function transformContent(content) {
  const lines = content.split('\n')

  // Find the last import line index
  let lastImportIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImportIdx = i
  }

  if (lastImportIdx === -1) return null

  const exportFnRegex = /^export async function (GET|POST|PUT|DELETE|PATCH)\((.*)\)\s*\{$/

  const result = []
  let importInserted = false
  let inFunction = false
  let braceCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Insert withApiLogging import after last import
    if (i === lastImportIdx && !importInserted) {
      result.push(line)
      result.push(IMPORT_LINE)
      importInserted = true
      continue
    }

    if (!inFunction) {
      const match = line.match(exportFnRegex)
      if (match) {
        const method = match[1]
        const params = match[2]
        inFunction = true
        braceCount = 1

        result.push(`export const ${method} = withApiLogging(async (${params}) => {`)
      } else {
        result.push(line)
      }
    } else {
      // Count braces to find the function's closing brace
      for (const ch of line) {
        if (ch === '{') braceCount++
        else if (ch === '}') braceCount--
      }

      if (braceCount === 0) {
        result.push('})')
        inFunction = false
      } else {
        result.push(line)
      }
    }
  }

  return result.join('\n')
}

function findRouteFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findRouteFiles(fullPath))
    } else if (entry.name === 'route.ts') {
      files.push(fullPath)
    }
  }
  return files
}

const routeFiles = findRouteFiles(ROUTES_DIR)
let transformed = 0
let skipped = 0

for (const filePath of routeFiles) {
  if (SKIP_FILES.includes(filePath)) {
    console.log(`Skipped: ${path.relative(ROUTES_DIR, filePath)}`)
    skipped++
    continue
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Skip if already has withApiLogging
  if (content.includes('withApiLogging')) {
    console.log(`Already has withApiLogging: ${path.relative(ROUTES_DIR, filePath)}`)
    skipped++
    continue
  }

  // Skip if no exported async function handlers
  if (!/^export async function (GET|POST|PUT|DELETE|PATCH)/m.test(content)) {
    console.log(`No exported handlers: ${path.relative(ROUTES_DIR, filePath)}`)
    skipped++
    continue
  }

  const newContent = transformContent(content)
  if (newContent === null) {
    console.log(`Could not transform: ${path.relative(ROUTES_DIR, filePath)}`)
    continue
  }

  fs.writeFileSync(filePath, newContent, 'utf8')
  console.log(`Transformed: ${path.relative(ROUTES_DIR, filePath)}`)
  transformed++
}

console.log(`\nDone. Transformed: ${transformed}, Skipped: ${skipped}`)
