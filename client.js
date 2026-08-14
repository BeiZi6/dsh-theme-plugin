// dsh-theme-plugin v0.1 — 作者：Xu Yuanshan · 2026-08-14
// Client bundle (official web-shell closure-factory shape).
// The shell serves this file as /plugins/dsh-theme-plugin/client.js and mounts
// it through the module table; React arrives via require("react") (platform
// seed module). Plain JS only: no TS/JSX/import statements.
//
// Provides the "主题工作室" settings section: preset picker, UI/code font
// pickers, contrast slider. Every change hot-applies through the official
// theme service (ctx.theme.overrideTokens) — the ThemePresenter writes the
// tokens as inline styles on <body>, so switching takes effect immediately,
// no page refresh. The selection is persisted in localStorage.
//
// The color derivation below is a copy of index.js (same pure functions,
// kept in sync manually; both halves derive identical token values).
window.__ModuleLoader__.load({
  id: 'dsh-theme-plugin',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')

    // ---------------------------------------------------------------------
    // Color math (mirrors index.js)
    // ---------------------------------------------------------------------

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

    // ---------------------------------------------------------------------
    // Presets (mirrors index.js)
    // ---------------------------------------------------------------------

    const presets = {
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

    // ---------------------------------------------------------------------
    // Derive one mode's tokens (mirrors index.js deriveMode)
    // ---------------------------------------------------------------------

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

      const fonts = {}
      if (cfg.uiFont) fonts['--dsw-font-family'] = cfg.uiFont
      if (cfg.codeFont) fonts['--ds-font-family-code'] = cfg.codeFont

      return { colors, fonts }
    }

    // ---------------------------------------------------------------------
    // Selection → override layer (per-token { light, dark } pairs)
    // ---------------------------------------------------------------------

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

    // Selection shape: { preset, accent, background, foreground, uiFont,
    // codeFont, translucentSidebar, contrast } — empty color/font strings and
    // 'preset' fall back to the selected preset's own values.
    function buildOverride(sel) {
      const base = sel.preset === 'custom' ? presets['codex-warm'] : presets[sel.preset]
      const custom = {
        accent: typeof sel.accent === 'string' ? sel.accent : '',
        background: typeof sel.background === 'string' ? sel.background : '',
        foreground: typeof sel.foreground === 'string' ? sel.foreground : '',
        uiFont: sel.uiFont || '',
        codeFont: sel.codeFont || '',
        translucentSidebar: typeof sel.translucentSidebar === 'string' ? sel.translucentSidebar : 'preset',
        contrast: typeof sel.contrast === 'number' ? sel.contrast : -1,
      }
      const tokens = {}
      // stock keeps the built-in palette; only fonts may be overridden.
      const paletteBase = sel.preset === 'stock' ? null : base
      if (paletteBase !== null) {
        const light = deriveMode('light', resolveMode('light', paletteBase, custom))
        const dark = deriveMode('dark', resolveMode('dark', paletteBase, custom))
        for (const name of Object.keys(light.colors)) {
          const l = light.colors[name]
          const d = dark.colors[name]
          if (l) tokens[name] = { light: l, dark: d }
        }
        for (const name of Object.keys(light.fonts)) {
          const l = light.fonts[name]
          const d = dark.fonts[name]
          if (l) tokens[name] = { light: l, dark: d }
        }
      } else {
        if (custom.uiFont) tokens['--dsw-font-family'] = { light: custom.uiFont, dark: custom.uiFont }
        if (custom.codeFont) tokens['--ds-font-family-code'] = { light: custom.codeFont, dark: custom.codeFont }
      }
      return tokens
    }

    // ---------------------------------------------------------------------
    // Persistence
    // ---------------------------------------------------------------------

    const STORE_KEY = 'dsh-theme-plugin:selection'

    function loadSelection() {
      try {
        const raw = window.localStorage.getItem(STORE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && typeof parsed.preset === 'string') return parsed
      } catch {}
      return null
    }

    function saveSelection(sel) {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(sel))
      } catch {}
    }

    // ---------------------------------------------------------------------
    // Font options
    // ---------------------------------------------------------------------

    const UI_FONTS = [
      { value: '', label: '默认（跟随主题）' },
      { value: '"Source Han Serif SC", "Noto Serif SC", "Songti SC", serif', label: '思源宋体（暖色风）' },
      { value: '"Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif', label: 'Inter 现代' },
      { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif', label: '系统无衬线' },
    ]

    const CODE_FONTS = [
      { value: '', label: '默认（跟随主题）' },
      { value: '"SF Mono", "JetBrains Mono", "Cascadia Code", Consolas, monospace', label: 'SF Mono / JetBrains Mono' },
      { value: '"Cascadia Code", Consolas, "Courier New", monospace', label: 'Cascadia Code' },
      { value: '"Consolas", "Liberation Mono", Menlo, monospace', label: 'Consolas' },
    ]

    const PRESET_KEYS = ['stock', 'codex-warm', 'nord', 'solarized', 'graphite']

    // ---------------------------------------------------------------------
    // UI
    // ---------------------------------------------------------------------

    const style = {
      section: { display: 'flex', flexDirection: 'column', gap: '14px' },
      row: { display: 'flex', flexDirection: 'column', gap: '6px' },
      label: { fontSize: '12px', lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' },
      chips: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
      chip: {
        padding: '4px 12px',
        borderRadius: '6px',
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        cursor: 'pointer',
        fontSize: '13px',
        lineHeight: '20px',
      },
      chipActive: {
        borderColor: 'var(--dsw-alias-brand-primary)',
        background: 'var(--dsw-alias-interactive-bg-hover-accent)',
        color: 'var(--dsw-alias-brand-text)',
      },
      select: {
        padding: '5px 8px',
        borderRadius: '6px',
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: '13px',
      },
      range: { accentColor: 'var(--dsw-alias-brand-primary)' },
      hint: { fontSize: '12px', lineHeight: '18px', color: 'var(--dsw-alias-label-caption)' },
    }

    // ---------------------------------------------------------------------
    // Cordis plugin entry
    // ---------------------------------------------------------------------

    exports.name = 'theme-plugin'

    exports.inject = ['slots', 'theme']

    function normalizeSelection(sel) {
      return {
        preset: typeof sel.preset === 'string' && sel.preset ? sel.preset : 'codex-warm',
        accent: typeof sel.accent === 'string' ? sel.accent : '',
        background: typeof sel.background === 'string' ? sel.background : '',
        foreground: typeof sel.foreground === 'string' ? sel.foreground : '',
        uiFont: typeof sel.uiFont === 'string' ? sel.uiFont : '',
        codeFont: typeof sel.codeFont === 'string' ? sel.codeFont : '',
        translucentSidebar: typeof sel.translucentSidebar === 'string' ? sel.translucentSidebar : 'preset',
        contrast: typeof sel.contrast === 'number' ? sel.contrast : -1,
      }
    }

    exports.apply = function (ctx, config) {
      const slots = ctx.get('slots')
      if (slots === undefined) return

      // Initial selection: localStorage wins, otherwise the host config.
      const stored = loadSelection()
      let initial
      if (stored !== null) {
        initial = normalizeSelection(stored)
      } else {
        const cfg = config || {}
        const light = cfg.light || {}
        const dark = cfg.dark || {}
        initial = normalizeSelection({
          preset: typeof cfg.preset === 'string' ? cfg.preset : 'codex-warm',
          accent: typeof light.accent === 'string' ? light.accent : '',
          background: typeof light.background === 'string' ? light.background : '',
          foreground: typeof light.foreground === 'string' ? light.foreground : '',
          uiFont: typeof light.uiFont === 'string' ? light.uiFont : '',
          codeFont: typeof light.codeFont === 'string' ? light.codeFont : '',
          translucentSidebar: typeof light.translucentSidebar === 'string' ? light.translucentSidebar : 'preset',
          contrast: typeof light.contrast === 'number' && light.contrast >= 0 ? light.contrast : -1,
          _dark: typeof dark.uiFont === 'string' ? dark.uiFont : '',
          _darkCode: typeof dark.codeFont === 'string' ? dark.codeFont : '',
        })
      }

      const applySelection = (sel) => {
        ctx.theme.overrideTokens('dsh-theme-plugin', buildOverride(sel))
        saveSelection(sel)
      }

      applySelection(initial)

      const ThemeStudio = () => {
        const [sel, setSel] = React.useState(initial)
        React.useEffect(() => {
          applySelection(sel)
        }, [sel])

        const update = (patch) => setSel((prev) => ({ ...prev, ...patch }))

        const chip = (key, active) => React.createElement(
          'button',
          {
            type: 'button',
            key: key,
            onClick: () => update({ preset: key }),
            style: active ? { ...style.chip, ...style.chipActive } : style.chip,
          },
          presets[key].label,
        )

        const select = (value, onChange, options) => React.createElement(
          'select',
          { style: style.select, value: value, onChange: (e) => onChange(e.target.value) },
          options.map((opt) => React.createElement('option', { key: opt.value, value: opt.value }, opt.label)),
        )

        // Custom colors apply to both light and dark; empty string follows the
        // preset. stock (DeepSeek 默认) derives no palette, so color controls
        // are disabled there — only fonts remain overridable.
        const presetLight = (key) => {
          const p = presets[sel.preset]
          return p && p.light ? (p.light[key] || '') : ''
        }
        const colorDisabled = sel.preset === 'stock'
        const colorRow = (labelText, field, fallback) => React.createElement(
          'div',
          { style: { ...style.row, opacity: colorDisabled ? 0.55 : 1 } },
          React.createElement('div', { style: style.label }, labelText),
          React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
            React.createElement('input', {
              type: 'color',
              value: sel[field] || presetLight(fallback) || '#DA7756',
              disabled: colorDisabled,
              style: { width: '44px', height: '28px', padding: 0, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '6px', background: 'var(--dsw-alias-bg-layer-1)' },
              onChange: (e) => update({ [field]: e.target.value }),
            }),
            React.createElement('button', {
              type: 'button',
              style: style.chip,
              disabled: colorDisabled || !sel[field],
              onClick: () => update({ [field]: '' }),
            }, '跟随预设'),
          ),
        )

        return React.createElement(
          'div',
          { style: style.section },
          React.createElement('div', { style: style.row },
            React.createElement('div', { style: style.label }, '主题预设'),
            React.createElement('div', { style: style.chips },
              PRESET_KEYS.map((key) => chip(key, sel.preset === key)),
            ),
          ),
          colorRow('强调色', 'accent', 'accent'),
          colorRow('背景色', 'background', 'background'),
          colorRow('前景色（文字）', 'foreground', 'foreground'),
          React.createElement('div', { style: style.row },
            React.createElement('div', { style: style.label }, '界面字体'),
            select(sel.uiFont, (v) => update({ uiFont: v }), UI_FONTS),
          ),
          React.createElement('div', { style: style.row },
            React.createElement('div', { style: style.label }, '代码字体'),
            select(sel.codeFont, (v) => update({ codeFont: v }), CODE_FONTS),
          ),
          React.createElement('div', { style: style.row },
            React.createElement('div', { style: style.label }, '半透明侧边栏'),
            select(sel.translucentSidebar, (v) => update({ translucentSidebar: v }), [
              { value: 'preset', label: '跟随预设' },
              { value: 'on', label: '开启' },
              { value: 'off', label: '关闭' },
            ]),
          ),
          React.createElement('div', { style: style.row },
            React.createElement('div', { style: style.label }, '对比度（' + (sel.contrast < 0 ? '预设' : sel.contrast) + '）'),
            React.createElement('input', {
              type: 'range',
              min: 0,
              max: 100,
              value: sel.contrast < 0 ? 60 : sel.contrast,
              style: style.range,
              onChange: (e) => update({ contrast: Number(e.target.value) }),
            }),
            React.createElement('button', { type: 'button', style: style.chip, onClick: () => update({ contrast: -1 }) }, '恢复预设对比度'),
          ),
          React.createElement('div', { style: style.hint }, '切换即时生效，无需刷新页面；选择保存在本机浏览器，刷新后保持。'),
        )
      }

      slots.inject('settings.section', () => slots.register(
        { name: 'settings.section', id: 'theme-studio', order: 200, label: '主题工作室' },
        () => React.createElement(ThemeStudio),
      ))
    }

    return module.exports
  },
})
