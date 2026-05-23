export function extractIcuPlaceholders(input: string): Set<string> {
  const out = new Set<string>()
  let depth = 0
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (c === '{') {
      if (depth === 0) {
        let j = i + 1
        if (j < input.length && /[A-Za-z_]/.test(input[j])) {
          j++
          while (j < input.length && /[A-Za-z0-9_]/.test(input[j])) j++
          out.add(input.slice(i + 1, j))
        }
      }
      depth++
    } else if (c === '}') {
      depth = Math.max(0, depth - 1)
    }
  }
  return out
}
