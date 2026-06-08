import fs from 'fs'
import path from 'path'

const SRC = 'src'
const MIN = '5' // p-5 = 20px
const PAD_RE = /\b(p|px|py|pt|pb|pl|pr)-(0\.5|1\.5|2\.5|0|1|2|3|4)(?!\d)\b/g
const ARB_PAD_RE = /\b(p|px|py|pt|pb|pl|pr)-\[[^\]]+\]/g

function walk(dir) {
  const files = []
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) files.push(...walk(p))
    else if (/\.(jsx|css)$/.test(f.name)) files.push(p)
  }
  return files
}

function bumpPadding(content) {
  let out = content.replace(PAD_RE, (_, prop) => `${prop}-${MIN}`)
  out = out.replace(ARB_PAD_RE, (_, prop) => `${prop}-${MIN}`)
  return out
}

const changed = []
for (const file of walk(SRC)) {
  const before = fs.readFileSync(file, 'utf8')
  const after = bumpPadding(before)
  if (after !== before) {
    fs.writeFileSync(file, after)
    changed.push(file)
  }
}

console.log('Modified files:', changed.length)
changed.forEach((f) => console.log(f))
