# TAPE / MIND — AI Workflow for Media

AI 媒体创作过程档案网站。保留参考站点的七个页面、手写视觉风格、素材库与提案编辑器，使用 **Vite 8 + Node.js + npm + 原生 ES Modules** 开发。

参考站点：https://ai-workflow-media-archive.zhouyulin20050826.chatgpt.site/

## 公开网站

GitHub Pages 地址：**https://zhouyulin20050826-glitch.github.io/Website/**（首次部署成功后可访问）。访问者不需要 GitHub 或 ChatGPT 登录。

推送到 `main` 后，`.github/workflows/pages.yml` 会检查、构建并发布 `dist/`。可在 [部署记录](https://github.com/zhouyulin20050826-glitch/Website/actions/workflows/pages.yml) 查看进度；构建或发布失败时，修复后再次推送即可。源码继续保留在仓库中，可随时编辑。

网站可以发布正式提案和配套媒体供所有人查看。个人编辑仍保存在本机 IndexedDB，需要导出并由维护者发布后才会共享；localhost 的数据不会自动复制到公开网址。

## 上传以前编辑好的 Idea Presentation

新编辑器提供“导入完整提案”和“导出完整备份”，备份包含文字、图片、视频和排版。旧 ChatGPT 站点没有导出按钮时，使用一次性导出脚本取出原浏览器中的数据。完整步骤见 [迁移和发布指南](docs/idea-presentation-transfer.md)。

维护者拿到备份后执行 `npm run publish:idea -- "备份文件路径.json"`，检查并提交生成的 `public/presentation.json` 和 `public/presentation-assets/`，推送到 main 后自动公开发布。访客默认看到正式提案，本机草稿会单独保留。

## 本地启动

安装 **Node.js 24 LTS（包含 npm）**，安装后重新打开终端。在项目根目录执行：

```powershell
cd C:\Users\Legion\Desktop\AI_Website_ZYL
npm install
npm run dev
```

打开 **http://localhost:5173/**（终端可能显示等价的 http://127.0.0.1:5173/）。按 `Ctrl+C` 停止。开发时修改源码会自动更新。不要双击 HTML 文件打开，也不要直接编辑 dist。

当前 Codex 环境只提供 Node、没有全局 npm，已准备好仅限本机的备用 npm。若当前终端提示找不到 npm，可执行：

```powershell
. .\scripts\enable-npm.ps1
npm run dev
```

备用工具在被 Git 忽略的 `.tools/`，不会上传仓库。其他电脑安装官方 Node.js（自带 npm）即可，不需要备用工具。如果 PowerShell 阻止 npm.ps1，使用 `npm.cmd run dev`。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` / `npm start` | 开发服务器，端口 5173 |
| `npm run check` | 检查七个页面入口和 JS 语法 |
| `npm run build` | 生成可部署的 dist/ |
| `npm run preview` | 预览构建结果，http://localhost:4173/ |
| `npm ci` | 根据 package-lock.json 安装一致的依赖，适合克隆后或 CI |

端口固定，已占用时会报错，不会悄悄换端口。请停止占用该端口的进程。建议始终使用 localhost，避免与 127.0.0.1 的浏览器数据分开。

## 目录分类

```text
├── *.html                  七个独立页面入口，保留原有链接
├── src/
│   ├── main.js             页面初始化与按需加载
│   ├── components/layout.js 公共导航、页脚、标题组件
│   ├── content/pages.js    页面文案和展示结构
│   ├── features/
│   │   ├── references.js   素材库与 IndexedDB
│   │   └── idea-editor.js  提案编辑器与 IndexedDB
│   └── styles/             基础、主题和编辑器样式
├── public/assets/          原有角色图片等静态资源
├── docs/                   架构与迁移记录
├── scripts/                检查和本机工具辅助脚本
├── .github/workflows/      GitHub 自动检查和构建
├── .openai/hosting.json     保留原 Sites 身份；本次不发布
├── vite.config.js          多页面构建与本地端口
├── package.json            依赖与 npm 命令
└── package-lock.json       提交到 Git，锁定依赖版本
```

修改文案到 `src/content/pages.js`；修改导航、页脚到 `src/components/layout.js`；修改视觉到 `src/styles/`；编辑器行为到 `src/features/idea-editor.js`。`dist/` 现在仅为构建输出，不再是源码目录。

## 页面与数据

- 首页：项目介绍与摄像头故障互动。
- Visual Journey：素材上传、链接、注释与删除。
- Idea Presentation：富文本、图片视频、自由文字框、拖动缩放旋转、撤销与展示锁定。
- Working Log、Project、Feedback、About：保留原版本文案和占位内容，不擅自替换作者资料或作品。

素材和提案使用 **IndexedDB 保存在当前浏览器、当前域名和端口下**。线上站点数据不会自动进入 localhost，localhost 与 127.0.0.1 也不共享数据。此次保留原数据库名称、对象仓库和数据结构，但没有增加后端、云同步或登录。摄像头需浏览器授权；未授权时显示替代效果。Google Fonts 需要网络，无网络时使用 CSS 后备字体。

## GitHub 管理

GitHub 仓库：[zhouyulin20050826-glitch/Website](https://github.com/zhouyulin20050826-glitch/Website)。`origin` 用于 GitHub；保留的 `sites` 远程用于原 Sites 项目。源码、图片、配置和依赖锁文件均可继续编辑，`dist/` 是可重新生成的构建结果。

在其他电脑继续开发（先安装 Node.js 24 LTS）：

```powershell
git clone https://github.com/zhouyulin20050826-glitch/Website.git
cd Website
npm ci
npm run dev
```

日常编辑：先确认本地没有未保存/未提交的改动，再用 `git pull --ff-only` 获取最新代码。修改 `src/`、根目录 HTML 或 `public/`，在 localhost 检查，然后执行：

```powershell
npm run check
npm run build
git status
git add .
git commit -m "Describe your website changes"
git push origin main
```

推送需要登录具备该仓库写入权限的 GitHub 账号。多人协作或较大修改建议新建 `codex/功能名称` 分支并通过 PR 合并。不要覆盖 `sites` 远程。提交源码、图片、文档、配置和 lockfile；`node_modules/`、`dist/`、本机工具、临时文件、旧打包文件和 `.env` 已忽略。浏览器 IndexedDB 中编辑的素材与提案不属于源码，不会随 Git 提交或同步。

每次 push / pull request，GitHub Actions 会运行 `npm ci`、检查和构建；推送到 main 还会自动部署 GitHub Pages。建议用功能分支和 PR 管理后续变更。原 `.html` 链接均保留，Vite 使用相对资源路径支持 `/Website/` 子目录部署。根目录的 `.openai/hosting.json` 保留原 Sites 身份，GitHub Pages 的部署不会发布或改变原 Sites 站点。
