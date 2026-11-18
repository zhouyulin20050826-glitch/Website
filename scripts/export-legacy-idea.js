// 在仍能看到旧提案的浏览器页面中运行一次。
// 只读取该站点 IndexedDB，下载本机 JSON；不会修改原数据或上传任何内容。
(async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('ai-workflow-idea-deck');
    request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('当前地址没有旧提案，请回到能看到完整内容的页面。')); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  let deck;
  try {
    deck = await new Promise((resolve, reject) => {
      const request = db.transaction('presentation').objectStore('presentation').get('main');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
  if (!deck?.cover || !Array.isArray(deck.sections)) throw Error('当前浏览器没有保存好的提案。请在原页面先完成保存，再导出。');
  for (const section of deck.sections) for (const media of section.media || []) {
    if (!(media.file instanceof Blob)) throw Error('媒体文件缺失，已停止导出以避免丢失内容。');
    const dataURL = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(media.file);
    });
    media.file = {name:media.file.name || media.name, type:media.file.type, lastModified:media.file.lastModified || 0, data:dataURL.slice(dataURL.indexOf(',') + 1)};
  }
  const backup = {format:'tape-mind-idea', formatVersion:1, exportedAt:new Date().toISOString(), deck};
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup)], {type:'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'idea-presentation-legacy-backup.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  console.log('完整提案备份已下载，包含文字、图片、视频与排版。旧站数据保持不变。');
})().catch(error => { console.error(error); alert('导出失败：' + error.message); });
