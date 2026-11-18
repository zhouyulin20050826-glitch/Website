import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {decodeBackup,BACKUP_FORMAT,mediaTypes} from '../src/features/idea-backup.js';

export async function preparePublication(backup, publicDir) {
  const deck=decodeBackup(backup);
  deck.locked=true;
  const assets=new Map();
  for(const section of deck.sections) for(const media of section.media) {
    const bytes=Buffer.from(await media.file.arrayBuffer());
    // GitHub rejects individual files >= 100 MiB. Fail before writing anything.
    if(bytes.length>=100*1024*1024) throw Error('单个媒体文件超过 GitHub 100 MiB 限制，请先压缩视频。');
    const hash=createHash('sha256').update(bytes).digest('hex');
    const asset=`presentation-assets/${hash}.${mediaTypes[media.file.type]}`;
    assets.set(asset,bytes);
    media.asset=asset;
    delete media.file;
  }
  const revision=createHash('sha256').update(JSON.stringify(deck)).digest('hex');
  await fs.mkdir(path.join(publicDir,'presentation-assets'),{recursive:true});
  for(const [name,bytes] of assets) await fs.writeFile(path.join(publicDir,name),bytes);
  // Write the manifest last. Keep older assets so an older open page still works.
  const manifest={format:BACKUP_FORMAT,formatVersion:1,revision,deck};
  const destination=path.join(publicDir,'presentation.json');
  await fs.writeFile(destination+'.tmp',JSON.stringify(manifest,null,2)+'\n');
  await fs.rename(destination+'.tmp',destination);
  return {sections:deck.sections.length,assets:assets.size,revision};
}

if(process.argv[1] && path.resolve(process.argv[1])===import.meta.filename) {
  try {
    if(!process.argv[2]) throw Error('用法：npm run publish:idea -- "备份文件的完整路径.json"');
    const backup=JSON.parse(await fs.readFile(path.resolve(process.argv[2]),'utf8'));
    const result=await preparePublication(backup,path.resolve(import.meta.dirname,'../public'));
    console.log(`已准备公开提案：${result.sections} 个章节，${result.assets} 个媒体文件。`);
    console.log('请运行 npm run build 检查，再提交 public/presentation.json 和 public/presentation-assets 并推送。');
  } catch(error) {console.error(error.message);process.exitCode=1;}
}
