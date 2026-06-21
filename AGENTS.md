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
