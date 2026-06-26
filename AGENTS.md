# 项目上下文

## 基本信息

- 项目：键盘输入模拟器 Chrome 扩展
- 当前版本：v1.2.2
- 本地路径：C:\Users\29372\keyboard-simulator
- GitHub 仓库：https://github.com/GeLith/keyboard-simulator-web
- 官网：https://felixdd.top/keyboard.html

## 配置

- GitHub Token 在 `.opencode-config.json` 里，创建 Release 等操作直接用，不用再问用户
- Git remote URL 已内嵌 token，直接 `git push` 即可

## 规范

- 压缩包/crx 文件名带版本号：`keyboard-simulator-v1.2.0.zip`、`keyboard-simulator-v1.2.0.crx`
- 每次发新版需同步更新 README.md 和 install.html 中的下载链接（版本号）
- 所有下载链接和安装引导优先指向官网 `felixdd.top/keyboard.html`，不要用 GitHub Pages
- 通过 GitHub API 操作时注意 UTF-8 编码，避免中文乱码
- `git reset --hard` 会丢失历史，谨慎使用

## 用户偏好

- 中文沟通
- 不要过度解释，简洁为主
- 改完代码记得同步更新 README.md 和 install.html
- 安装方法、功能描述、更新日志要保持一致

## 项目结构

```
keyboard-simulator/
├── manifest.json          # 扩展清单，权限 activeTab/scripting/storage
├── background.js          # Service Worker，转发 typingComplete 消息
├── content.js             # 核心：悬浮球、面板、模拟键盘输入
├── content.css            # 悬浮球 + 面板样式（紫蓝渐变）
├── popup.html             # 扩展弹窗页面
├── popup.js               # 弹窗逻辑：发送 startTyping/stopTyping
├── popup.css              # 弹窗样式
├── install.html           # 安装引导页
├── README.md              # 仓库说明
├── AGENTS.md              # 本文件
├── .opencode-config.json  # GitHub token 等配置
├── icons/                 # 扩展图标 (svg/png16/48/128)
├── website/                # 官网源码（gitignored，发版时手动同步）
│   └── keyboard.html
├── keyboard-simulator-v1.2.2.crx
└── keyboard-simulator-v1.2.2.zip
```

## 发布流程

1. 修改代码 → content.js / content.css 等
2. 版本号同步 → manifest.json 的 version + content.js 的 VERSION
3. 打包 → `crx pack` 生成 .crx，`Compress-Archive` 生成 .zip（文件名带版本号）
4. 更新文档 → README.md + install.html（下载链接、功能描述、更新日志）
5. 提交推送 → `git add -A && git commit && git push`
6. 发布 Release → 用 .opencode-config.json 里的 token 调 GitHub API 创建 release + 上传附件
7. 更新官网 → 修改 `website/keyboard.html` 中的下载链接版本号 → 复制到 `../gelithmp/keyboard.html` → git push gelithmp 仓库 → Vercel 自动部署

## API 创建 Release 示例

```powershell
$token = "从 .opencode-config.json 读取"
$headers = @{ "Authorization" = "token $token"; "Accept" = "application/vnd.github.v3+json" }
# 创建 release
$body = @{ tag_name = "v1.2.0"; name = "v1.2.0"; body = "更新内容..." } | ConvertTo-Json
Invoke-RestMethod -Uri "https://api.github.com/repos/GeLith/keyboard-simulator-web/releases" -Method Post -Headers $headers -Body $body -ContentType "application/json; charset=utf-8"
# 上传附件
Invoke-RestMethod -Uri "https://uploads.github.com/repos/GeLith/keyboard-simulator-web/releases/{id}/assets?name=xxx.zip" -Method Post -Headers $headers -InFile "xxx.zip" -ContentType "application/zip"
```

## Progress
### Done
- v1.2.2 released：悬浮球/面板位置重置 + 清空按钮
- v1.1.1 released：删除 Alt+K 快捷键、面板可拖动（位置自动保存）、悬浮球图标优化（紫蓝渐变）
- 下载链接改为 GitHub Release 带版本号路径
- 安装引导页 install.html 已简化并指向官网
- README.md 已同步更新
- AGENTS.md 项目上下文已建立
- 清理误提交的 node_modules、package.json（token 泄露风险），更新 .gitignore 并 commit
- 学习通 UEditor 输入问题已解决：直接调用 iframe.contentDocument.execCommand('insertText')
- v1.2.0 released：支持超星学习通 UEditor

### In Progress
- (none)

### Blocked
- (none)

### Release Checklist
1. 改代码
2. 版本号同步
3. 打包 crx + zip
4. 更新 README.md + install.html
5. 更新 website/keyboard.html（下载链接版本号）→ 复制到 gelithmp/keyboard.html
6. git commit & push (两个仓库)
7. GitHub Release
8. Vercel 自动部署（如果没自动，手动触发）

## Key Decisions
- 回退到 v1.1 后重新发布 v1.1.1（重置历史导致之前的提交丢失）
- 放弃 `chrome.scripting.executeScript` + `world: 'MAIN'` 方案（CSP 或参数传递问题）
- 放弃 `iframe.contentWindow.UE` 直接调用（isolated world 无法访问 MAIN world 变量）
- 最终方案：直接从 content script 调用 `iframe.contentDocument.execCommand('insertText', false, char)`，无需 MAIN world 注入、无需 CSP 绕过、无需消息通信

## Lessons Learned
- **版本更新必须走完整个发布流程**：改版本号 → 打包 crx+zip → 更新文档 → 更新官网 → 创建 GitHub Release 并上传附件 → 推送到两个仓库。只改版本号和链接但跳过 Release 创建，下载会 404。

## Chaoxing UEditor 攻关记录
- 核心问题：UEditor iframe 同源，但其 JS API（UE 全局）在 isolated world 不可达
- CSP `script-src 'self'` 阻止 inline script 注入到 MAIN world
- `chrome.scripting.executeScript` + `world: 'MAIN'`：注入成功但参数传递复杂（DOM 属性方式在特定场景失效）
- `postMessage` 到 iframe：未被 iframe content script 接收
- `iframe.contentWindow.UE`：isolated world 限制，无法访问 MAIN world 的 UE 全局
- **最终解决**：`iframe.contentDocument.execCommand('insertText', false, char)` — content script 可直接调 DOM API，UEditor 使用 contenteditable iframe body，execCommand 可直接写入并触发 input 事件

## Relevant Files
- `content.js`: 核心逻辑，含 UEditor iframe 检测及 execCommand 输入
- `background.js`: Service Worker，处理 typingComplete 和 executeInMainWorld（非 UEditor 回退）
- `manifest.json`: v1.2.2，permissions: [activeTab, scripting, storage]，all_frames: true
- `injected.js`: 非 UEditor 回退路径用（contenteditable 元素）
- `install.html`: 安装引导页，链接指向官网
