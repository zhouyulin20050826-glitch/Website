# 迁移记录与架构

## 参考版本

用户指定站点对应 `.openai/hosting.json` 中的项目。2026-11-17 通过 Sites 查询，最新保存版本 v9 的源码提交为 `8e9a5f5082eb19fa22374bc6cb0ea7f38fe83c92`，与本地迁移前 HEAD 相同。迁移前工作区没有网站源码修改。线上 HTTP 访问需要登录，未绕过访问策略；使用上述版本来源核实代码基准。

## 实现选择

采用 Vite 多页面应用和原生 JavaScript ES Modules。Vite 是开发/构建工具，Node.js 是工具运行环境；无需另行引入 React 或 Express 即可满足 npm 和 localhost 的需求。七个页面及 URL 保持原样。

原 app.js 拆为公共布局、页面内容、素材库功能和 main.js。提案编辑器按页面动态导入，数据库结构不变。原 CSS、图片和文案保留，包含未使用的 visual.css，便于后续查阅。HTML 统一加载 main.js，由 Vite 处理样式、模块和生产资源指纹。

## 工作流

开发：根目录 HTML + src + public → Vite 开发服务器。

交付：npm ci → npm run check → npm run build → dist 静态文件。

原始源码可通过 Git 提交 8e9a5f5 查阅。历史 tar.gz 和文档提取目录保留在本机且忽略，不自动删除用户文件。保留 Sites 身份配置及远程，不触发线上部署。用户于 2026-11-18 指定 GitHub origin 为 https://github.com/zhouyulin20050826-glitch/Website.git，日常编辑工作流见 README。

## 验证记录（2026-11-17）

- npm 安装成功，依赖审计未报告漏洞。
- npm run check 和 npm run build 成功，构建无未解析资源警告。
- 开发服务 localhost:5173 与生产预览 localhost:4173：七个页面、编辑器/素材库模块及两张角色图片均 HTTP 200。
- 与 v9 源码逐项核对：七页模板、公共布局、编辑器脚本、素材库脚本、CSS 与图片字节一致，CSS 图片路径按新结构修正。
- 浏览器自动化因 Windows 当前 URL 检测限制被停止；没有完成截图对比、鼠标交互或浏览器数据库读写的运行验收。
- dist 已从 Git 索引取消跟踪，本地构建文件仍保留。Git 状态中的 dist 删除项属于这一迁移；下一次提交应同时纳入根目录入口和 src/public 等新文件。未创建提交或推送。
