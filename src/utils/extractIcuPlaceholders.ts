// Tolgee tag interpolation uses JSX-style tags in the message text, e.g.
// `Click <a>here</a>` with `params={{ a: <a /> }}`. Hyphenated names like
// `<my-tag>` are allowed via quoted property keys in params.
const TAG_RE = /<\/?([A-Za-z_][A-Za-z0-9_-]*)/g

const NAME_START_RE = /[A-Za-z_]/
const NAME_CONT_RE = /[A-Za-z0-9_]/
const WS_RE = /\s/

const SUBMESSAGE_TYPES = new Set(['plural', 'select', 'selectordinal'])

interface Cursor {
  i: number
}

export function extractIcuPlaceholders(input: string): Set<string> {
  const out = new Set<string>()

  let m: RegExpExecArray | null
  TAG_RE.lastIndex = 0
  while ((m = TAG_RE.exec(input)) !== null) out.add(m[1])

  const cursor: Cursor = { i: 0 }
  parseMessage(input, cursor, out)
  return out
}

function parseMessage(input: string, cursor: Cursor, out: Set<string>): void {
  while (cursor.i < input.length && input[cursor.i] !== '}') {
    if (input[cursor.i] === '{') {
      cursor.i++
      parseArgument(input, cursor, out)
    } else {
      cursor.i++
    }
  }
}

function parseArgument(input: string, cursor: Cursor, out: Set<string>): void {
  skipWs(input, cursor)
  const name = readIdentifier(input, cursor)
  if (name == null) {
    skipToClose(input, cursor)
    return
  }
  out.add(name)
  skipWs(input, cursor)
  if (input[cursor.i] === '}') {
    cursor.i++
    return
  }
  if (input[cursor.i] !== ',') {
    skipToClose(input, cursor)
    return
  }
  cursor.i++ // consume `,`
  skipWs(input, cursor)
  const typeStart = cursor.i
  while (cursor.i < input.length && /[A-Za-z]/.test(input[cursor.i])) cursor.i++
  const type = input.slice(typeStart, cursor.i)
  skipWs(input, cursor)
  if (SUBMESSAGE_TYPES.has(type)) {
    if (input[cursor.i] === ',') cursor.i++
    parseSelectorClauses(input, cursor, out)
    if (input[cursor.i] === '}') cursor.i++
    return
  }
  // Simple typed argument (number, date, time, etc.) — skip the rest.
  skipToClose(input, cursor)
}

function parseSelectorClauses(input: string, cursor: Cursor, out: Set<string>): void {
  while (cursor.i < input.length && input[cursor.i] !== '}') {
    while (cursor.i < input.length && input[cursor.i] !== '{' && input[cursor.i] !== '}') {
      cursor.i++
    }
    if (input[cursor.i] !== '{') return
    cursor.i++ // consume `{`
    parseMessage(input, cursor, out)
    if (input[cursor.i] === '}') cursor.i++
  }
}

function readIdentifier(input: string, cursor: Cursor): string | null {
  if (cursor.i >= input.length || !NAME_START_RE.test(input[cursor.i])) return null
  const start = cursor.i
  cursor.i++
  while (cursor.i < input.length && NAME_CONT_RE.test(input[cursor.i])) cursor.i++
  return input.slice(start, cursor.i)
}

function skipWs(input: string, cursor: Cursor): void {
  while (cursor.i < input.length && WS_RE.test(input[cursor.i])) cursor.i++
}

function skipToClose(input: string, cursor: Cursor): void {
  let depth = 1
  while (cursor.i < input.length && depth > 0) {
    const c = input[cursor.i]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        cursor.i++
        return
      }
    }
    cursor.i++
  }
}
