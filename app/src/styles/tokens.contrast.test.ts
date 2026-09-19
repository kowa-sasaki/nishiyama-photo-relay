import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// `./tokens.css?raw` は Vitest ではCSS処理が無効なため空文字列になる（実測で確認済み）。
// そのため fs で直接読む。__dirname の使い方は lib/visitorScale.test.ts と同じ。
const tokensCss = readFileSync(resolve(__dirname, 'tokens.css'), 'utf-8')

const HEX_TOKEN = /--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g
const DARK_MARKER = '@media (prefers-color-scheme: dark)'
const MIN_CONTRAST = 4.5

function parseTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {}
  for (const match of css.matchAll(HEX_TOKEN)) {
    tokens[match[1]] = match[2]
  }
  return tokens
}

function channelToLinear(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b)
}

function contrastRatio(fg: string, bg: string): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}

function requireToken(tokens: Record<string, string>, name: string): string {
  const value = tokens[name]
  if (!value) throw new Error(`token --${name} not found in tokens.css`)
  return value
}

const darkStart = tokensCss.indexOf(DARK_MARKER)
const lightTokens = parseTokens(tokensCss.slice(0, darkStart))
// ダークブロックは差分のみを上書きするので、ライトの値をベースに重ねる
const darkTokens = { ...lightTokens, ...parseTokens(tokensCss.slice(darkStart)) }

// [文字色, 背景色]。実際に文字として使われている組み合わせだけを対象にする
const TEXT_PAIRS: [string, string][] = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text-muted', 'bg'],
  ['text-muted', 'surface'],
  ['accent', 'bg'],
  ['accent', 'surface'],
  ['on-accent', 'accent'],
  ['status-warn-text', 'bg'],
  ['status-warn-text', 'surface'],
  ['status-warn-text', 'status-warn-bg'],
]

const THEMES: { name: string; tokens: Record<string, string> }[] = [
  { name: 'light', tokens: lightTokens },
  { name: 'dark', tokens: darkTokens },
]

describe('design token contrast', () => {
  it('finds both the light and the dark token blocks', () => {
    expect(darkStart).toBeGreaterThan(0)
    expect(Object.keys(lightTokens)).toContain('accent')
    expect(darkTokens.accent).not.toBe(lightTokens.accent)
  })

  for (const { name, tokens } of THEMES) {
    describe(`${name} theme`, () => {
      it.each(TEXT_PAIRS)(`--%s on --%s is at least ${MIN_CONTRAST}:1`, (fg, bg) => {
        const ratio = contrastRatio(requireToken(tokens, fg), requireToken(tokens, bg))
        expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST)
      })
    })
  }
})
