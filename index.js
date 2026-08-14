// dsh-theme-plugin v0.1 — 作者：Xu Yuanshan · 2026-08-14
// Host 半端：通过 webServer.tapIndex 官方接缝向每次 index.html 响应注入主题 <style>。
import z from '@deepseek-ai/schemastery'

export const name = 'theme-plugin'

// ---------------------------------------------------------------------------
// Color math (no external deps)
// ---------------------------------------------------------------------------

function parseColor(input) {
  const c = String(input).trim()
  if (c.startsWith('#')) {
    const hex = c.slice(1)
    if (hex.length === 3) {
      const [r, g, b] = hex.split('').map((h) => parseInt(h + h, 16))
      return { r, g, b, a: 1 }
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      }
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      }
    }
  }
  const m = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/)
  if (m) {
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] }
  }
  throw new Error('theme-plugin: unsupported color format "' + c + '"')
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)) }

function round(c) {
  return { r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b), a: c.a ?? 1 }
}

function formatHex(c) {
  const parsed = typeof c === 'string' ? parseColor(c) : c
  const x = round(parsed)
  const a = x.a ?? 1
  if (a !== 1) return 'rgba(' + x.r + ', ' + x.g + ', ' + x.b + ', ' + a.toFixed(3) + ')'
  return '#' + [x.r, x.g, x.b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function mix(a, b, t) {
  const A = parseColor(a); const B = parseColor(b)
  const s = clamp(t, 0, 1)
  return formatHex({
    r: A.r + (B.r - A.r) * s,
    g: A.g + (B.g - A.g) * s,
    b: A.b + (B.b - A.b) * s,
    a: A.a + (B.a - A.a) * s,
  })
}

function alpha(color, a) {
  const c = parseColor(color)
  return formatHex({ r: c.r, g: c.g, b: c.b, a: clamp(a, 0, 1) })
}

function luminance(color) {
  const c = parseColor(color)
  const channel = (v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
}

function readableOn(bg, lightOption, darkOption) {
  return luminance(bg) > 0.5 ? darkOption : lightOption
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export const presets = {
  stock: {
    name: 'stock',
    label: 'DeepSeek 默认',
    light: { accent: '', background: '', foreground: '', uiFont: '', codeFont: '', translucentSidebar: 'preset', contrast: -1 },
    dark: { accent: '', background: '', foreground: '', uiFont: '', codeFont: '', translucentSidebar: 'preset', contrast: -1 },
  },
  'codex-warm': {
    name: 'codex-warm',
    label: 'Codex 暖色',
    light: {
      accent: '#DA7756',
      background: '#F5F3EE',
      foreground: '#1D1B16',
      uiFont: '"Source Han Serif SC", "Noto Serif SC", "Songti SC", serif',
      codeFont: '"SF Mono", "Cascadia Code", Consolas, "Microsoft YaHei", monospace',
      translucentSidebar: 'off',
      contrast: 60,
    },
    dark: {
      accent: '#CC7D5E',
      background: '#2D2D2B',
      foreground: '#F9F9F7',
      uiFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
      codeFont: 'ui-monospace, "SF Mono", "Cascadia Code", Consolas, "Microsoft YaHei", monospace',
      translucentSidebar: 'on',
      contrast: 60,
    },
  },
  nord: {
    name: 'nord',
    label: 'Nord',
    light: {
      accent: '#5E81AC',
      background: '#ECEFF4',
      foreground: '#2E3440',
      uiFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      codeFont: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
      translucentSidebar: 'off',
      contrast: 60,
    },
    dark: {
      accent: '#88C0D0',
      background: '#2E3440',
      foreground: '#ECEFF4',
      uiFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      codeFont: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
      translucentSidebar: 'on',
      contrast: 60,
    },
  },
  solarized: {
    name: 'solarized',
    label: 'Solarized',
    light: {
      accent: '#B58900',
      background: '#FDF6E3',
      foreground: '#657B83',
      uiFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      codeFont: '"SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      translucentSidebar: 'off',
      contrast: 55,
    },
    dark: {
      accent: '#268BD2',
      background: '#002B36',
      foreground: '#839496',
      uiFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      codeFont: '"SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      translucentSidebar: 'on',
      contrast: 55,
    },
  },
  graphite: {
    name: 'graphite',
    label: 'Graphite',
    light: {
      accent: '#525252',
      background: '#FAFAFA',
      foreground: '#171717',
      uiFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      codeFont: '"JetBrains Mono", Consolas, "Microsoft YaHei", monospace',
      translucentSidebar: 'off',
      contrast: 65,
    },
    dark: {
      accent: '#A3A3A3',
      background: '#171717',
      foreground: '#FAFAFA',
      uiFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      codeFont: '"JetBrains Mono", Consolas, "Microsoft YaHei", monospace',
      translucentSidebar: 'on',
      contrast: 65,
    },
  },
}

// ---------------------------------------------------------------------------
// Config schema
// ---------------------------------------------------------------------------

const ModeSchema = z.object({
  accent: z.string().default(''),
  background: z.string().default(''),
  foreground: z.string().default(''),
  uiFont: z.string().default(''),
  codeFont: z.string().default(''),
  translucentSidebar: z.union(['preset', 'on', 'off']).default('preset'),
  contrast: z.number().default(-1),
})

export const Config = z.object({
  preset: z.union(['stock', 'codex-warm', 'nord', 'solarized', 'graphite', 'custom']).default('codex-warm'),
  light: ModeSchema.default({}),
  dark: ModeSchema.default({}),
})

// ---------------------------------------------------------------------------
// Derive one mode's tokens (returns { colors, fonts })
// ---------------------------------------------------------------------------

function deriveMode(mode, cfg) {
  const bg = cfg.background
  const fg = cfg.foreground
  const accent = cfg.accent
  const ts = cfg.translucentSidebar
  const contrast = cfg.contrast
  const k = clamp(contrast / 100, 0, 1)
  const layerF = clamp(0.6 + 0.8 * k, 0, 1)
  const borderF = clamp(0.5 + 0.9 * k, 0, 1)
  const labelF = clamp(1.4 - 0.8 * k, 0, 1)
  const textOnAccent = readableOn(accent, '#FFFFFF', '#0F1115')
  const translucent = ts === 'on'
  const sidebarFill = translucent
    ? alpha(mix(bg, fg, 0.03 * layerF), 0.65)
    : mix(bg, fg, 0.03 * layerF)
  const isLight = mode === 'light'

  const colors = {
    '--dsw-alias-bg-base': bg,
    '--dsw-alias-bg-layer-1': mix(bg, fg, 0.02 * layerF),
    '--dsw-alias-bg-layer-2': mix(bg, fg, 0.04 * layerF),
    '--dsw-alias-bg-layer-3': mix(bg, fg, 0.06 * layerF),
    '--dsw-alias-bg-overlay': alpha(mix(bg, fg, isLight ? 0.08 * layerF : 0.04 * layerF), 0.9),
    '--dsw-alias-bg-mask-1': alpha('#000000', isLight ? 0.24 : 0.5),
    '--dsw-alias-bg-mask-2': alpha('#000000', isLight ? 0.12 : 0.2),
    '--dsw-alias-bg-mask-3': alpha('#000000', 0.48),
    '--dsw-alias-bg-mask-photo': alpha('#000000', 0.88),
    '--dsw-alias-bg-mask-drop': alpha(mix(bg, fg, 0.12), 0.7),
    '--dsw-alias-bg-module-platform': mix(bg, fg, 0.025 * layerF),
    '--dsw-alias-bg-multi-select': mix(bg, fg, 0.03 * layerF),
    '--dsw-alias-bg-skeleton': alpha(fg, 0.06),
    '--dsw-alias-border-l1': alpha(fg, 0.04 * borderF),
    '--dsw-alias-border-l2': alpha(fg, 0.10 * borderF),
    '--dsw-alias-border-l2-darkmode-thin': alpha(fg, 0.06 * borderF),
    '--dsw-alias-border-l3': alpha(fg, 0.12 * borderF),
    '--dsw-alias-border-l4': alpha(fg, 0.16 * borderF),
    '--dsw-alias-border-inverted': alpha(bg, 0.06),
    '--dsw-alias-border-inverted2': alpha(bg, 0.08),
    '--dsw-alias-brand-primary': accent,
    '--dsw-alias-brand-primary-invert': textOnAccent,
    '--dsw-alias-brand-text': accent,
    '--dsw-alias-brand-primary-new-colorprimary-new-color': accent,
    '--dsw-alias-label-primary-foreground': textOnAccent,
    '--dsw-alias-button-primary-fill': accent,
    '--dsw-alias-button-primary-hover': mix(accent, textOnAccent, 0.12),
    '--dsw-alias-button-primary-dimmed': mix(bg, fg, 0.08 * layerF),
    '--dsw-alias-button-contrast-fill': fg,
    '--dsw-alias-button-elevated-fill': mix(bg, fg, 0.04 * layerF),
    '--dsw-alias-button-floating-fill': mix(bg, fg, 0.02 * layerF),
    '--dsw-alias-button-floating-hover': mix(bg, fg, 0.05 * layerF),
    '--dsw-alias-button-ghost-active-border': mix(bg, fg, 0.35 * borderF),
    '--dsw-alias-button-ghost-active-fill': mix(bg, fg, 0.06 * layerF),
    '--dsw-alias-button-ghost-active-hover': mix(bg, fg, 0.09 * layerF),
    '--dsw-alias-button-info-fill': accent,
    '--dsw-alias-button-info-hover': mix(accent, textOnAccent, 0.12),
    '--dsw-alias-interactive-bg-hover': alpha(fg, 0.06),
    '--dsw-alias-interactive-bg-active': alpha(fg, 0.12),
    '--dsw-alias-interactive-bg-hover-accent': alpha(accent, 0.14),
    '--dsw-alias-interactive-bg-hover-solid': mix(bg, fg, 0.04 * layerF),
    '--dsw-alias-interactive-bg-hover-danger': alpha('#EC1313', 0.05),
    '--dsw-alias-label-primary': fg,
    '--dsw-alias-label-primary-dimmed': mix(fg, bg, 0.10 * labelF),
    '--dsw-alias-label-primary-bluish': fg,
    '--dsw-alias-label-primary-inverted': bg,
    '--dsw-alias-label-secondary': mix(fg, bg, 0.28 * labelF),
    '--dsw-alias-label-tertiary': mix(fg, bg, 0.42 * labelF),
    '--dsw-alias-label-caption': mix(fg, bg, 0.55 * labelF),
    '--dsw-alias-label-dimmed': mix(fg, bg, 0.72 * labelF),
    '--dsw-alias-markdown-code-block': mix(bg, fg, 0.02 * layerF),
    '--dsw-alias-markdown-code-block-banner': mix(bg, fg, 0.03 * layerF),
    '--dsw-alias-markdown-inline-code': mix(bg, fg, 0.04 * layerF),
    '--dsw-alias-markdown-citation': mix(bg, fg, 0.04 * layerF),
    '--dsw-alias-markdown-code-segment-selected': mix(bg, fg, 0.07 * layerF),
    '--dsw-alias-markdown-code-segment-unselected': mix(bg, fg, 0.02 * layerF),
    '--dsw-alias-markdown-placeholder': mix(bg, fg, 0.03 * layerF),
    '--dsw-alias-markdown-tag': mix(bg, fg, 0.03 * layerF),
    '--dsw-alias-scrollbar-bg-l1': mix(bg, fg, 0.12 * borderF),
    '--dsw-alias-scrollbar-bg-l2': mix(bg, fg, 0.12 * borderF),
    '--dsw-alias-scrollbar-hover-l1': mix(bg, fg, 0.20 * borderF),
    '--dsw-alias-scrollbar-hover-l2': mix(bg, fg, 0.20 * borderF),
    '--dsw-alias-state-business-primary': accent,
    '--dsw-alias-state-business-tertiary': mix(accent, bg, 0.55),
    '--dsw-alias-toast-bg': mix(bg, fg, isLight ? 0.82 : 0.22),
    '--dsw-alias-tooltip-bg': mix(bg, fg, isLight ? 0.78 : 0.26),
    '--dsw-specific-bubble': mix(bg, accent, 0.06),
    '--dsw-specific-bubble-highlight': mix(bg, accent, 0.18),
    '--dsw-specific-input-major': mix(bg, fg, 0.01 * layerF),
    '--dsw-specific-login-input': mix(bg, fg, 0.02 * layerF),
    '--dsw-specific-menu': mix(bg, fg, 0.06 * layerF),
    '--dsw-specific-selector': mix(bg, fg, 0.025 * layerF),
    '--dsw-specific-tip': mix(bg, fg, 0.025 * layerF),
    '--dsw-specific-sidebar-fill': sidebarFill,
    '--dsw-specific-sidebar-nav-item-active-accent': mix(bg, accent, 0.12),
    '--dsw-specific-sidebar-nav-item-active': mix(bg, fg, 0.06 * layerF),
    '--dsw-specific-sidebar-nav-item-hover': mix(bg, fg, 0.03 * layerF),
  }

  const fonts = {
    '--dsw-font-family': cfg.uiFont,
    '--ds-font-family-code': cfg.codeFont,
  }

  return { colors, fonts }
}

// ---------------------------------------------------------------------------
// Preset + custom merge
// ---------------------------------------------------------------------------

function resolveMode(mode, preset, custom) {
  const p = preset[mode]
  const c = custom || {}
  return {
    accent: c.accent || p.accent,
    background: c.background || p.background,
    foreground: c.foreground || p.foreground,
    uiFont: c.uiFont || p.uiFont,
    codeFont: c.codeFont || p.codeFont,
    translucentSidebar: c.translucentSidebar !== 'preset' ? c.translucentSidebar : p.translucentSidebar,
    contrast: c.contrast >= 0 ? c.contrast : p.contrast,
  }
}

function resolveConfig(raw) {
  const presetName = raw.preset
  const preset = presetName === 'custom' ? presets['codex-warm'] : presets[presetName]
  return {
    light: resolveMode('light', preset, raw.light),
    dark: resolveMode('dark', preset, raw.dark),
  }
}

// ---------------------------------------------------------------------------
// CSS generation
// ---------------------------------------------------------------------------

export function generateCss(rawConfig) {
  if (rawConfig.preset === 'stock') return ''
  const cfg = resolveConfig(rawConfig)
  const lightVars = deriveMode('light', cfg.light)
  const darkVars = deriveMode('dark', cfg.dark)

  function renderVars(vars) {
    const colors = Object.entries(vars.colors).map(([k, v]) => (v ? k + ':' + formatHex(v) : '')).filter(Boolean)
    const fonts = Object.entries(vars.fonts).map(([k, v]) => (v ? k + ':' + v : '')).filter(Boolean)
    return [...colors, ...fonts].join(';')
  }

  const lightCss = renderVars(lightVars)
  const darkCss = renderVars(darkVars)
  let css = ''
  if (lightCss) css += 'html body{' + lightCss + '}'
  if (darkCss) css += 'html body[data-ds-dark-theme]{' + darkCss + '}'
  return css
}

export function injectStyle(html, rawConfig) {
  const css = generateCss(rawConfig)
  if (!css) return html
  const style = '<style id="dsh-theme-plugin">' + css + '</style>'
  const headEnd = /<\/head>/i.exec(html)
  if (headEnd === null) return html + style
  const at = headEnd.index
  return html.slice(0, at) + style + html.slice(at)
}

// ---------------------------------------------------------------------------
// Cordis plugin entry
// ---------------------------------------------------------------------------

export function apply(ctx, rawConfig) {
  ctx.inject(['webServer'], (httpCtx) => {
    httpCtx.effect(
      () => httpCtx.webServer.tapIndex((html) => injectStyle(html, rawConfig)),
      'dsh-theme-plugin: inject custom theme CSS into index responses',
    )
  })
}