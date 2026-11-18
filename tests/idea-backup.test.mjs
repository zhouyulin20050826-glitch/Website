import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {createBackup,decodeBackup,loadPublishedDeck,normalizeDeck} from '../src/features/idea-backup.js';
import {preparePublication} from '../scripts/publish-idea.mjs';

const fixture=()=>({version:5,locked:false,cover:{title:'我的 <b>提案</b>',subtitle:'Proposal',titleSize:110,titleColor:'#123456',titleBold:false,subtitleSize:32},sections:[{id:'section-1',title:'构思',body:'第一行<br>第二行',layout:2,bg:'#ff4a00',stageWidth:125,stageHeight:700,media:[{id:'image-1',kind:'image',name:'image.png',file:new File([new Uint8Array([137,80,78,71,13,10,26,10])],'image.png',{type:'image/png',lastModified:123456}),x:20,y:30,w:44,z:7,rotate:33},{id:'video-1',kind:'video',name:'video.mp4',file:new File(['video\0bytes'],'video.mp4',{type:'video/mp4'}),x:40,y:50,w:51,rotate:-12}],textBoxes:[{id:'box-1',html:'<b>带格式的文字</b>',x:12,y:24,w:36,z:21,size:42,rotate:-18}]}]});

test('complete backup round trip preserves rich text, layout and binary image/video bytes',async()=>{
  const original=fixture();
  const encoded=JSON.parse(JSON.stringify(await createBackup(original)));
  const restored=decodeBackup(encoded);
  assert.equal(restored.cover.title,original.cover.title);
  assert.equal(restored.cover.titleBold,false);
  assert.equal(restored.sections[0].stageWidth,125);
  assert.equal(restored.sections[0].textBoxes[0].rotate,-18);
  assert.deepEqual(restored.sections[0].textBoxes[0],normalizeDeck(original).sections[0].textBoxes[0]);
  for(let i=0;i<2;i++){
    const before=original.sections[0].media[i],after=restored.sections[0].media[i];
    assert.equal(after.file.name,before.file.name);assert.equal(after.file.type,before.file.type);
    assert.equal(after.rotate,before.rotate);
    assert.deepEqual(await after.file.arrayBuffer(),await before.file.arrayBuffer());
  }
});

test('invalid backups and unsafe media cannot replace existing content',async()=>{
  assert.throws(()=>decodeBackup({sections:[]}),/完整 JSON/);
  const encoded=await createBackup(fixture());
  encoded.deck.sections[0].media[0].file.data='invalid-base64!!';
  assert.throws(()=>decodeBackup(encoded),/媒体/);
  encoded.deck.sections[0].media[0].file={type:'text/html',data:btoa('<script>alert(1)</script>')};
  assert.throws(()=>decodeBackup(encoded),/媒体/);
  assert.throws(()=>normalizeDeck({version:99,cover:{},sections:[]}),/更新版本/);
});

test('large video backups validate and decode without overflowing the regular expression stack',()=>{
  const bytes=Buffer.alloc(8*1024*1024,123);
  const backup={format:'tape-mind-idea',formatVersion:1,deck:{version:5,cover:{title:'Large video'},sections:[{id:'video-section',media:[{id:'large-video',kind:'video',file:{name:'video.mp4',type:'video/mp4',data:bytes.toString('base64')}}]}]}};
  const decoded=decodeBackup(backup);
  assert.equal(decoded.sections[0].media[0].file.size,bytes.length);
});

test('empty presentation is valid and legacy plain text stays plain text',async()=>{
  const empty=fixture();empty.sections=[];
  assert.equal(decodeBackup(await createBackup(empty)).sections.length,0);
  const old={version:1,cover:{title:'<b>literal</b>'},sections:[]};
  assert.equal(normalizeDeck(old).cover.title,'&lt;b&gt;literal&lt;/b&gt;');
});

test('publication writes portable assets and loads without any private browser draft',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'idea-publish-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const encoded=await createBackup(fixture());
  const result=await preparePublication(encoded,dir);
  assert.equal(result.assets,2);
  const manifest=JSON.parse(await fs.readFile(path.join(dir,'presentation.json'),'utf8'));
  assert.equal(manifest.deck.locked,true);
  assert.equal(manifest.deck.sections[0].media[0].file,undefined);
  assert.match(manifest.deck.sections[0].media[0].asset,/^presentation-assets\/[a-f0-9]{64}\.png$/);
  let requested=0;
  const mockFetch=async url=>{
    requested++;
    url=new URL(url);
    assert.equal(url.origin,'https://example.com');
    assert.ok(url.pathname.startsWith('/Website/'));
    const file=url.pathname.slice('/Website/'.length);
    return new Response(await fs.readFile(path.join(dir,file)),{headers:{'Content-Type':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':'video/mp4'}});
  };
  const published=await loadPublishedDeck(new URL('https://example.com/Website/'),mockFetch);
  assert.equal(requested,1,'Initial page load reads only the manifest, without downloading videos');
  assert.equal(published.deck.cover.title,fixture().cover.title);
  assert.equal(published.revision,result.revision);
  assert.equal(published.deck.sections[0].media[0].file,undefined);
  const exportedAgain=decodeBackup(await createBackup(published.deck,mockFetch));
  assert.deepEqual(await exportedAgain.sections[0].media[0].file.arrayBuffer(),await fixture().sections[0].media[0].file.arrayBuffer());
  // Publishing the same backup is deterministic, so repeated deploys do not add duplicate media.
  assert.equal((await preparePublication(encoded,dir)).revision,result.revision);
});

test('invalid import does not overwrite an already published manifest',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'idea-publish-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  await fs.writeFile(path.join(dir,'presentation.json'),'existing');
  await assert.rejects(preparePublication({},dir));
  assert.equal(await fs.readFile(path.join(dir,'presentation.json'),'utf8'),'existing');
});

test('missing or unpublished content falls back, while broken publications report errors',async()=>{
  assert.equal(await loadPublishedDeck(new URL('https://example.com/'),async()=>new Response('',{status:404})),null);
  const blank={format:'tape-mind-idea',formatVersion:1,revision:null,deck:null};
  assert.equal(await loadPublishedDeck(new URL('https://example.com/'),async()=>Response.json(blank)),null);
  await assert.rejects(loadPublishedDeck(new URL('https://example.com/'),async()=>new Response('',{status:500})),/无法加载/);
  const encoded=await createBackup(fixture());
  encoded.revision='test';encoded.deck.sections[0].media[0].asset='https://attacker.example/file';
  await assert.rejects(loadPublishedDeck(new URL('https://example.com/'),async()=>Response.json(encoded)),/媒体地址/);
});

test('legacy export reads the original database without writing and produces an importable backup',async()=>{
  const stored=fixture();
  let downloadedURL,resolveDone,rejectDone;
  const done=new Promise((resolve,reject)=>{resolveDone=resolve;rejectDone=reject;});
  const context={Blob,URL,Uint8Array,Date,Promise,Array,Error,console:{log:resolveDone,error:rejectDone},alert:rejectDone,setTimeout:()=>{},
    document:{createElement:()=>({set href(value){downloadedURL=value;},set download(value){assert.equal(value,'idea-presentation-legacy-backup.json');},click(){}})},
    FileReader:class{async readAsDataURL(blob){this.result=`data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;this.onload();}},
    indexedDB:{open(name){
      assert.equal(name,'ai-workflow-idea-deck');
      const request={};
      queueMicrotask(()=>{request.result={close(){},transaction(store,mode){
        assert.equal(store,'presentation');assert.notEqual(mode,'readwrite');
        return {objectStore:()=>({get(key){assert.equal(key,'main');const read={};queueMicrotask(()=>{read.result=structuredClone(stored);read.onsuccess();});return read;}})};
      }};request.onsuccess();});
      return request;
    }},
  };
  vm.runInNewContext(await fs.readFile(new URL('../scripts/export-legacy-idea.js',import.meta.url),'utf8'),context);
  await done;
  const backup=await (await fetch(downloadedURL)).json();
  URL.revokeObjectURL(downloadedURL);
  const restored=decodeBackup(backup);
  assert.equal(restored.cover.title,stored.cover.title);
  assert.equal(restored.sections[0].media[0].rotate,33);
  assert.deepEqual(await restored.sections[0].media[0].file.arrayBuffer(),await stored.sections[0].media[0].file.arrayBuffer());
  assert.ok(stored.sections[0].media[0].file instanceof Blob);
});
