# dsh-theme-plugin

**作者：Xu Yuanshan · 2026-08-14 · MIT**

为 DSH Web GUI 打造的「主题工作室」插件——**5 套内置预设 + 完全自定义**（Codex 暖色 / Nord / Solarized / Graphite / 自定义调色板，允许逐字段覆盖）。

## 功能

| 字段 | 类型 | 说明 |
|---|---|---|
| `preset` | 枚举 | 选一个预设作为基底（详见下表） |
| `light.accent` | 颜色 | 浅色主题的强调色（主按钮、链接等） |
| `light.background` | 颜色 | 浅色背景 |
| `light.foreground` | 颜色 | 浅色主文字 |
| `light.uiFont` | CSS font-family | 浅色 UI 字体 |
| `light.codeFont` | CSS font-family | 浅色代码字体 |
| `light.translucentSidebar` | `preset` / `on` / `off` | 半透明侧边栏 |
| `light.contrast` | 0–100 | 浅色对比度 |
| `dark.*` | 同上 | 深色版套对应字段 |

空字符串 = 用预设值；`contrast: -1` = 用预设值；`translucentSidebar: 'preset'` = 用预设值。任意字段留空就完全不覆盖。

## 设置页热切换（推荐用法）

插件带官方 Client half（`dsh.client` web bundle）：重启后进入 **设置 → 主题工作室**，全部配置均可通过 GUI 完成：

- **主题预设**：DeepSeek 默认 / Codex 暖色 / Nord / Solarized / Graphite，一键切换；
- **强调色 / 背景色 / 前景色**：颜色选择器，支持「跟随预设」复位；
- **界面字体 / 代码字体**：下拉选择常用字体栈；
- **半透明侧边栏**：跟随预设 / 开启 / 关闭；
- **对比度**：滑条 0–100，可恢复预设值。

所有切换通过官方 `ctx.theme.overrideTokens` 应用 —— 主题呈现器把 token 写成 `<body>` 内联样式，**立即生效、无需刷新页面**（深浅色自动跟随系统的明暗偏好）。选择保存在浏览器 `localStorage`，刷新后保持。`cordis.patch.yml` 的 config 仍是首次打开的默认值，设置页选择优先于 config。

注意：`stock`（DeepSeek 默认）不派生颜色，此时颜色控件禁用，仅字体可覆盖。

## 预设

| 预设 | 风格 | 浅色背景 / 前景 / 强调 | 深色背景 / 前景 / 强调 |
|---|---|---|---|
| `stock` | DeepSeek 默认 | （不覆盖） | （不覆盖） |
| `codex-warm` | Codex 暖色（截图复刻） | #F5F3EE / #1D1B16 / #DA7756 | #2D2D2B / #F9F9F7 / #CC7D5E |
| `nord` | Nord 冷色 | #ECEFF4 / #2E3440 / #5E81AC | #2E3440 / #ECEFF4 / #88C0D0 |
| `solarized` | Solarized | #FDF6E3 / #657B83 / #B58900 | #002B36 / #839496 / #268BD2 |
| `graphite` | 灰阶极简 | #FAFAFA / #171717 / #525252 | #171717 / #FAFAFA / #A3A3A3 |
| `custom` | 完全自定义 | 由 `light.*` / `dark.*` 字段提供 | 同左 |

## 实现机制

- **官方扩展点**：用 `@deepseek-ai/dsh-host-webserver` 的 `webServer.tapIndex(html => ...)` 在每次响应 index.html 时插入一段 `<style>`（放在 `</head>` 前、样式表 link 之后，级联上后声明生效）。和官方 `ui-theme` 注入 boot theme 用的是同一个接缝。
- **覆盖范围**：用更高优先级的 `html body` / `html body[data-ds-dark-theme]`（特异性 0,0,0,2 / 0,0,1,2），压过主题静态 CSS 的同名列。
- **派生**：给定 3 个用户色（背景/前景/强调）+ 对比度，函数式推导出 70+ 个语义令牌（border l1–l4、layer 1–3、scrollbar、tooltip、markdown code block、bubble、sidebar 状态等）。状态色（success/error/warn）保持 stock 用途。
- **透明边栏**：`--dsw-specific-sidebar-fill` 会被设为 `rgba(mix(bg,fg,3%), 0.65)`——该变量已被 AppFrame / SidebarRoot / WorkspaceBrowser / TrajectoryTable 消费，半透明侧边栏真实生效。

## 安装

```sh
dsh plugin --profile web add github:BeiZi6/dsh-theme-plugin
```

重启 `dsh web` 生效（HMR 会热更新配置，但插件首次挂载需要重启）。

## 自定义

编辑 `$DSH_HOME/profiles/web/cordis.patch.yml`（或更高优先级：`$DSH_HOME/cordis.patch.yml` / `--patch` 覆盖），覆盖该行——注意：**只写 `id` 和 `config`，不要写 `name`、不要包在 `insert:` 里**（那样会变成「再插入一行同 id 的记录」，loader 会报 duplicate id）：

```yaml
- id: theme-plugin
  config:
    preset: codex-warm
    light:
      accent: '#FF6B35'
      background: '#FFFAF0'
      foreground: '#1A1A1A'
      uiFont: '"Inter", "PingFang SC", sans-serif'
      codeFont: '"JetBrains Mono", Consolas, monospace'
      translucentSidebar: off
      contrast: 70
    dark:
      accent: '#FFB07A'
      background: '#1A1A1A'
      foreground: '#F5F5F5'
      uiFont: '"Inter", "PingFang SC", sans-serif'
      codeFont: '"JetBrains Mono", Consolas, monospace'
      translucentSidebar: on
      contrast: 70
```

只改某个字段（比如只要换强调色），其它字段填空白的字符串 / `preset` / `-1`。

## 卸载

```sh
dsh plugin --profile web remove dsh-theme-plugin
```
