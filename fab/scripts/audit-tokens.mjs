/**
 * Design-token audit.
 *
 * Components must express colour through the semantic tokens declared in
 * src/index.css — never a raw hex value and never a stock Tailwind palette
 * class, both of which would look wrong in one of the two themes.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'src'
const ALLOWED_FILES = ['src/index.css']
const PALETTES =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const CHECKS = [
  { name: 'hardcoded hex colour', pattern: new RegExp('#[0-9a-fA-F]{3,8}\\b', 'g') },
  {
    name: 'stock Tailwind palette class',
    pattern: new RegExp(`\\b(?:bg|text|border|ring|fill|stroke|from|via|to|decoration|outline|shadow|accent|caret|divide|placeholder)-(?:${PALETTES})-\\d{2,3}\\b`, 'g'),
  },
]

const files = []
;(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.(jsx?|css)$/.test(entry)) files.push(path)
  }
})(ROOT)

const problems = []
for (const file of files) {
  if (ALLOWED_FILES.includes(file)) continue
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, index) => {
    // Colours inside mock seed data and chart palettes are data, not styling.
    if (line.includes('audit-ignore')) return
    for (const check of CHECKS) {
      const matches = line.match(check.pattern)
      if (matches) {
        problems.push(`${file}:${index + 1}  ${check.name}: ${[...new Set(matches)].join(', ')}`)
      }
    }
  })
}

if (problems.length > 0) {
  console.log(`\n${problems.length} token violation(s):\n`)
  for (const problem of problems) console.log(`  ${problem}`)
  console.log('\nUse the semantic tokens (bg-surface, text-muted, border-border, …).\n')
  process.exit(1)
}

console.log(`\nToken audit clean across ${files.length} files.\n`)
