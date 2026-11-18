# 迁移旧提案并公开发布

提案不是 HTML 源码的一部分。旧版将文字、媒体 Blob 和排版存放在当前浏览器、当前站点的 IndexedDB。只有能看到完整旧内容的那个浏览器能导出它。代码仓库、其他浏览器和新域名不会自动获得这些数据。

## 从旧 ChatGPT 站点导出一次

1. 使用当时编辑所用的浏览器和配置文件打开旧站的 Idea Presentation。确认文字、图片、视频仍完整，点击原来的 `FINISH + LOCK`，等保存提示出现。
2. 打开本项目的 [scripts/export-legacy-idea.js](../scripts/export-legacy-idea.js)，复制文件的全部代码。它只读取 `ai-workflow-idea-deck` 数据库的 `presentation/main`，下载本机 JSON，不发起网络请求、不改动旧数据。
3. 在**旧站的页面**按 F12，选择 Console（控制台），输入这段代码并运行。不要在新站或浏览器其他页面运行。
4. 得到 `idea-presentation-legacy-backup.json`。检查文件不是空的，保留原文件作为备份。若提示找不到数据，请检查是否使用了原浏览器、原配置文件、原网站地址。

如果内容在 localhost 的旧编辑器里，更新项目后直接在同一个 localhost 地址打开页面，点击“导出完整备份”即可，不需要运行旧站脚本。

## 导入并继续编辑

在新站 Idea Presentation 点击“导入完整提案”，选择 JSON。导入前会告知章节和媒体数量并确认替换草稿。无效文件会被拒绝，不会修改当前草稿。导入会保留文字格式、章节、媒体文件、文字框、位置、大小、旋转和画布设置。

导入后只保存到本机；“撤销”可恢复导入前的草稿。导入不是公开发布。`FINISH + LOCK` 也只锁定本机展示。导出备份时，所有媒体以 base64 字节包含在 JSON 中，可迁移到其他浏览器，不依赖原站 blob URL。

## 发布给所有访问者

将备份交给项目维护者，或在项目根目录执行：

```powershell
npm run publish:idea -- "C:\完整路径\idea-presentation-legacy-backup.json"
npm test
npm run check
npm run build
git add public/presentation.json public/presentation-assets
git commit -m "Publish Idea Presentation content"
git push origin main
```

转换器把媒体拆分成 `public/presentation-assets/` 中以 SHA-256 命名的文件，并在 `public/presentation.json` 中保存正式提案。只发布选定的提案内容，不会上传浏览器的其他数据。单个媒体不得达到 GitHub 的 100 MiB 文件限制，视频过大时需先压缩。当前支持 PNG、JPEG、GIF、WebP、AVIF、HEIC 及 MP4、WebM、MOV、OGV；其他格式应先转换，不会静默丢弃。

推送后 GitHub Pages 自动发布。访客默认查看最新正式提案，处于展示锁定状态；个人草稿继续保存在独立的 IndexedDB 中，使用“继续本机草稿”打开。查看公开版本不会覆盖草稿，也不会把访客的编辑发布到仓库。原先保存的草稿不会遮挡新的公开内容。

正式提案的完整 JSON 和媒体对所有人可访问。只有具备仓库写入权限的维护者能够发布；网页中不会保存 GitHub 凭据，也没有供访客直接改写公开提案的接口。

当前正式提案来自用户提供的 `idea-presentation-legacy-backup.json`：6 个章节、25 张图片、1 个视频和 7 个文字框。转换时逐项核对原备份，保留了全部字段和媒体字节；26 处媒体展示对应 24 个去重后的静态文件。旧站和原备份保持不变。

公开页面只先读取提案清单，图片延迟加载，视频点击后再加载；不会为了显示文字而等待整段视频下载。导出正式提案时才下载所需媒体并打包为完整备份。
