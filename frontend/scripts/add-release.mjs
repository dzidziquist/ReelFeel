#!/usr/bin/env node
import readline from 'readline'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RELEASES_FILE = path.join(__dirname, '../src/data/releases.js')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise((res) => rl.question(q, res))

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const now = new Date()
const defaultDate = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`

console.log('\n  ReelFeel — add release\n')

const version = await ask(`  Version (e.g. 2.1.0): `)
const date    = await ask(`  Date [${defaultDate}]: `) || defaultDate
const label   = await ask(`  Badge label (e.g. "Latest", leave blank for none): `) || null

console.log('\n  Enter changes one per line. Empty line to finish:\n')
const changes = []
while (true) {
  const line = await ask('  + ')
  if (!line.trim()) break
  changes.push(line.trim())
}

rl.close()

if (!version || changes.length === 0) {
  console.error('\n  Version and at least one change are required.\n')
  process.exit(1)
}

const src = fs.readFileSync(RELEASES_FILE, 'utf8')

const entry = `  {
    version: '${version}',
    date: '${date}',
    label: ${label ? `'${label}'` : 'null'},
    changes: [
${changes.map(c => `      '${c.replace(/'/g, "\\'")}',`).join('\n')}
    ],
  },`

const updated = src.replace(
  'const RELEASES = [\n',
  `const RELEASES = [\n${entry}\n`
)

fs.writeFileSync(RELEASES_FILE, updated, 'utf8')

console.log(`\n  Added v${version} to releases.js`)
console.log('  Run: npm run build && vercel --prod\n')
