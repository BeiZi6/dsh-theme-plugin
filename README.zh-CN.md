# dsh-theme-plugin

**[简体中文](README.zh-CN.md) · [English](README.md)**

DeepSeek Harness (DSH) Web GUI 的主题工作室插件:5 套内置预设 + 完全自定义的浅色/深色调色板——强调色、背景、前景、界面字体、代码字体、半透明侧边栏与对比度,立即生效、无需刷新页面。

## 特性

- 🎨 **5 套内置预设** —— `codex-warm`、`nord`、`solarized`、`graphite`,外加 DeepSeek 默认主题 `stock`
- 🖌️ **完全自定义** —— 按模式(`light.*` / `dark.*`)分别设置强调色、背景、前景、界面字体、代码字体、半透明侧边栏与对比度;`custom` 模式从零开始
- ⚡ **即时热切换** —— 设置页「主题工作室」通过官方 `ctx.theme.overrideTokens` API 立即应用改动;浅色/深色自动跟随系统明暗偏好
- 💾 **持久化** —— 选择保存在浏览器 `localStorage` 中,刷新后保持
- 🧮 **70+ 派生令牌** —— 三个颜色加一个对比度值即可展开为整套语义令牌(边框、层级、滚动条、提示框、代码块、气泡、侧边栏状态……)
- 🪟 **半透明侧边栏** —— 通过 `--dsw-specific-sidebar-fill` 变量实现真正的毛玻璃侧边栏
- 🔌 **仅使用官方接缝** —— Host 端通过 `webServer.tapIndex` 注入,不修改任何供应商文件

## 安装

需要启用 web profile 的 DeepSeek Harness。从官方 registry 安装:

```sh
dsh plugin --profile web add github:BeiZi6/dsh-theme-plugin
```

重启 `dsh web` 后生效。

卸载:

```sh
dsh plugin --profile web remove dsh-theme-plugin
```

## 使用

### 设置页 GUI(推荐)

重启后打开 **设置 → 主题工作室**:

- **预设** —— 一键切换:DeepSeek 默认 / Codex 暖色 / Nord / Solarized / Graphite / 自定义
- **颜色** —— 强调色、背景、前景的颜色选择器,支持「跟随预设」复位
- **字体** —— 界面字体与代码字体的下拉选择(内置常用字体栈)
- **半透明侧边栏** —— 跟随预设 / 开启 / 关闭
- **对比度** —— 0–100 滑条,可恢复预设值

所有改动立即生效并本地持久化;GUI 中的选择优先于 Host 配置。

> `stock` 预设不派生调色板:颜色控件禁用,仅字体可覆盖。

### 配置字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `preset` | 枚举 | `stock` · `codex-warm` · `nord` · `solarized` · `graphite` · `custom`(默认 `codex-warm`) |
| `light.accent` | 颜色 | 浅色模式强调色(主按钮、链接等) |
| `light.background` | 颜色 | 浅色背景 |
| `light.foreground` | 颜色 | 浅色主文字 |
| `light.uiFont` | CSS `font-family` | 界面字体栈 |
| `light.codeFont` | CSS `font-family` | 代码字体栈 |
| `light.translucentSidebar` | 枚举 | `preset` · `on` · `off` |
| `light.contrast` | 数字 | 0–100;`-1` = 保持预设值 |
| `dark.*` | — | 深色模式的同名字段 |

空字符串表示「使用预设值」;未设置的字段完全不覆盖。

示例——合并进 web profile patch(`$DSH_HOME/profiles/web/cordis.patch.yml`):

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

只设置想改的字段,其余留空(`''` / `preset` / `-1`)。

### 预设

| 预设 | 风格 | 浅色 背景 / 前景 / 强调 | 深色 背景 / 前景 / 强调 |
|---|---|---|---|
| `stock` | DeepSeek 默认 | —(不覆盖) | —(不覆盖) |
| `codex-warm` | Codex 暖色 | `#F5F3EE` / `#1D1B16` / `#DA7756` | `#2D2D2B` / `#F9F9F7` / `#CC7D5E` |
| `nord` | Nord 冷色 | `#ECEFF4` / `#2E3440` / `#5E81AC` | `#2E3440` / `#ECEFF4` / `#88C0D0` |
| `solarized` | Solarized | `#FDF6E3` / `#657B83` / `#B58900` | `#002B36` / `#839496` / `#268BD2` |
| `graphite` | 灰阶极简 | `#FAFAFA` / `#171717` / `#525252` | `#171717` / `#FAFAFA` / `#A3A3A3` |

`custom` 以 `codex-warm` 调色板为起点,所有值取自 `light.*` / `dark.*`。

## 工作原理

- **Host 半端**(`index.js`) —— 注册 `webServer.tapIndex` 钩子:每次响应的 `index.html` 都会在 `</head>` 前、样式表 link 之后注入一段 `<style>`,利用级联顺序取胜。这与官方内置 UI 主题使用的是同一个接缝。
- **特异性** —— 选择器写作 `html body` / `html body[data-ds-dark-theme]`,压过主题的静态 CSS 变量。
- **令牌推导** —— 由背景 / 前景 / 强调三色加对比度因子,函数式推导 70+ 语义令牌(边框层级、层级背景、滚动条、提示框、markdown 代码块、气泡、侧边栏状态……)。状态色(success / error / warn)保持 stock 语义不变。
- **半透明侧边栏** —— 开启时 `--dsw-specific-sidebar-fill` 输出为 `rgba(mix(bg, fg, 3%), 0.65)`;AppFrame / SidebarRoot / WorkspaceBrowser / TrajectoryTable 直接消费该变量。
- **Client 半端**(`client.js`) —— 以 web-shell 模块注册「主题工作室」设置分区,每次改动通过 `ctx.theme.overrideTokens` 写入;主题呈现器将令牌内联写到 `<body>` 上,立即生效直到下次选择。选择保存在 `localStorage`。

## 兼容性

- DeepSeek Harness Web GUI(`dsh web`)
- Node.js >= 22.19
- Peer 依赖:`@deepseek-ai/cordis`(^4)、`@deepseek-ai/dsh-host-webserver`(^0.1.0-rc.6)

## 许可证

MIT © Xu Yuanshan

## 链接

- 仓库: <https://github.com/BeiZi6/dsh-theme-plugin>
- Issues: <https://github.com/BeiZi6/dsh-theme-plugin/issues>
