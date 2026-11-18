// Portable backups include the actual media bytes, never browser-only blob URLs.
export const BACKUP_FORMAT = 'tape-mind-idea';
const text = (v, fallback = '') => typeof v === 'string' ? v : fallback;
const number = (v, fallback, min, max) => Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Number(v))) : fallback;
const color = (v, fallback) => /^#[0-9a-f]{6}$/i.test(v || '') ? v : fallback;
const id = v => /^[a-z0-9_-]{1,100}$/i.test(v || '') ? v : crypto.randomUUID();
export const mediaTypes = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
  'image/webp': 'webp', 'image/avif': 'avif', 'image/heic': 'heic',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'video/ogg': 'ogv',
};

export function normalizeDeck(input) {
  if (!input || typeof input !== 'object' || !input.cover || !Array.isArray(input.sections)) throw Error('文件中没有完整的提案内容。');
  if (Number(input.version || 1) > 5) throw Error('备份来自更新版本的编辑器，请先更新网站。');
  const rich = value => Number(input.version || 1) < 2 ? text(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) : text(value);
  const typography = (o, cover = false) => ({
    title: rich(o.title), [cover ? 'subtitle' : 'body']: rich(o[cover ? 'subtitle' : 'body']),
    titleColor: color(o.titleColor, '#10110d'), [cover ? 'subtitleColor' : 'bodyColor']: color(o[cover ? 'subtitleColor' : 'bodyColor'], '#10110d'),
    titleBold: o.titleBold !== false, [cover ? 'subtitleBold' : 'bodyBold']: Boolean(o[cover ? 'subtitleBold' : 'bodyBold']),
    titleSize: number(o.titleSize, cover ? 126 : 64, 14, 180), [cover ? 'subtitleSize' : 'bodySize']: number(o[cover ? 'subtitleSize' : 'bodySize'], cover ? 36 : 26, 14, 180),
  });
  const position = o => ({id:id(o.id), x:number(o.x,6,-100,200), y:number(o.y,8,-100,200), w:number(o.w,38,1,200), z:number(o.z,2,0,1000), rotate:number(o.rotate,0,-9999,9999)});
  const seen = new Set();
  const unique = item => {if(seen.has(item.id)) item.id=crypto.randomUUID();seen.add(item.id);return item;};
  return {
    version: 5, locked: Boolean(input.locked), cover: typography(input.cover, true),
    sections: input.sections.map(s => {
      if(!s || typeof s !== 'object') throw Error('备份的章节格式不正确。');
      return {
        id: unique({id:id(s.id)}).id, ...typography(s), layout:Math.round(number(s.layout,0,0,2)), bg:color(s.bg,'#cfff00'),
        stageWidth:number(s.stageWidth,100,50,150), stageHeight:number(s.stageHeight,500,280,1600),
        media:(s.media || []).map(m => {
          if(!m || !['image','video'].includes(m.kind)) throw Error('备份中的媒体类型不正确。');
          return unique({...position(m), kind:m.kind, name:text(m.name,'media'), file:m.file, asset:m.asset});
        }),
        textBoxes:(s.textBoxes || []).map(b => unique({...position(b),html:rich(b.html),size:number(b.size,28,14,120)})),
      };
    }),
  };
}

export async function createBackup(state) {
  const deck = normalizeDeck(state);
  for(const section of deck.sections) for(const media of section.media) {
    if(!(media.file instanceof Blob)) throw Error('媒体文件尚未加载，请稍后再导出。');
    const bytes = new Uint8Array(await media.file.arrayBuffer());
    let binary = '';
    for(let i=0;i<bytes.length;i+=32768) binary += String.fromCharCode(...bytes.subarray(i,i+32768));
    media.file={name:media.file.name || media.name,type:media.file.type,lastModified:media.file.lastModified || 0,data:btoa(binary)};
    delete media.asset;
  }
  return {format:BACKUP_FORMAT,formatVersion:1,exportedAt:new Date().toISOString(),deck};
}

export function decodeBackup(input) {
  if(input?.format!==BACKUP_FORMAT || input.formatVersion!==1) throw Error('请选择 Idea Presentation 导出的完整 JSON 备份。');
  const deck=normalizeDeck(input.deck);
  for(const section of deck.sections) for(const media of section.media) {
    const file=media.file;
    if(!file || !mediaTypes[file.type] || !file.type.startsWith(media.kind+'/') || typeof file.data!=='string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.data)) throw Error('备份包含缺失、损坏或不支持的媒体文件。');
    const bytes=Uint8Array.from(atob(file.data),c=>c.charCodeAt(0));
    if(!bytes.length) throw Error('备份中存在空媒体文件。');
    media.file=new File([bytes],text(file.name,media.name),{type:file.type,lastModified:number(file.lastModified,0,0,Number.MAX_SAFE_INTEGER)});
    delete media.asset;
  }
  return deck;
}

export async function loadPublishedDeck(base, fetcher = fetch) {
  const response=await fetcher(new URL('presentation.json',base),{cache:'no-cache'});
  if(response.status===404) return null;
  if(!response.ok) throw Error('公开提案暂时无法加载，请刷新重试。');
  const publication=await response.json();
  if(publication.format===BACKUP_FORMAT && publication.formatVersion===1 && publication.revision===null && publication.deck===null) return null;
  if(publication.format!==BACKUP_FORMAT || publication.formatVersion!==1 || !publication.revision) throw Error('公开提案的格式不正确。');
  const deck=normalizeDeck(publication.deck);
  for(const section of deck.sections) for(const media of section.media) {
    if(typeof media.asset!=='string' || !/^presentation-assets\/[a-f0-9]{64}\.[a-z0-9]+$/.test(media.asset)) throw Error('公开提案的媒体地址不正确。');
    const asset=await fetcher(new URL(media.asset,base));
    if(!asset.ok) throw Error('公开提案的媒体加载失败，请刷新重试。');
    media.file=await asset.blob();
  }
  return {deck,revision:publication.revision};
}
