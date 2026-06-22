# 项目上下文

## 基本信息

- 项目：键盘输入模拟器 Chrome 扩展
- 当前版本：v1.1.1
- 本地路径：C:\Users\29372\keyboard-simulator
- GitHub 仓库：https://github.com/GeLith/keyboard-simulator-web
- 官网：https://felixdd.top/keyboard.html

## 配置

- GitHub Token 在 `.opencode-config.json` 里，创建 Release 等操作直接用，不用再问用户
- Git remote URL 已内嵌 token，直接 `git push` 即可

## 规范

- 压缩包/crx 文件名必须带版本号：`keyboard-simulator-v1.1.1.zip`、`keyboard-simulator-v1.1.1.crx`
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
├── keyboard-simulator-v1.1.1.crx
└── keyboard-simulator-v1.1.1.zip
```

## 发布流程

1. 修改代码 → content.js / content.css 等
2. 版本号同步 → manifest.json 的 version + content.js 的 VERSION
3. 打包 → `crx pack` 生成 .crx，`Compress-Archive` 生成 .zip（文件名带版本号）
4. 更新文档 → README.md + install.html（下载链接、功能描述、更新日志）
5. 提交推送 → `git add -A && git commit && git push`
6. 发布 Release → 用 .opencode-config.json 里的 token 调 GitHub API 创建 release + 上传附件

## API 创建 Release 示例

```powershell
$token = "从 .opencode-config.json 读取"
$headers = @{ "Authorization" = "token $token"; "Accept" = "application/vnd.github.v3+json" }
# 创建 release
$body = @{ tag_name = "v1.1.1"; name = "v1.1.1"; body = "更新内容..." } | ConvertTo-Json
Invoke-RestMethod -Uri "https://api.github.com/repos/GeLith/keyboard-simulator-web/releases" -Method Post -Headers $headers -Body $body -ContentType "application/json; charset=utf-8"
# 上传附件
Invoke-RestMethod -Uri "https://uploads.github.com/repos/GeLith/keyboard-simulator-web/releases/{id}/assets?name=xxx.zip" -Method Post -Headers $headers -InFile "xxx.zip" -ContentType "application/zip"
```
