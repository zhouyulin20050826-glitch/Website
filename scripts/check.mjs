import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const pages = ['index','visual-journey','idea-presentation','working-log','project','feedback','about'];
for (const page of pages) {
  const html = fs.readFileSync(`${page}.html`, 'utf8');
  if (!html.includes('/src/main.js') || !html.includes('id="site"')) throw Error(`Invalid entry: ${page}`);
}
for (const file of ['src/main.js','src/content/pages.js','src/components/layout.js','src/features/references.js','src/features/idea-editor.js','src/features/idea-backup.js','scripts/publish-idea.mjs','vite.config.js']) {
  const result = spawnSync(process.execPath, ['--check',file], {stdio:'inherit'});
  if(result.status !== 0) process.exit(1);
}
console.log('Seven page entries and JavaScript syntax checked.');
