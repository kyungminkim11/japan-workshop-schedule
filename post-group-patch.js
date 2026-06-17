(function(){
  const ZIP_LIB_URL='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';

  function postMediaId(post){return `fp:${String(post&&post.id||'').slice(0,29)}`.slice(0,32)}
  function mediaItemId(media){return media&&((media.itemId)||(media.item_id))||''}
  function mediaSource(media){return media&&((media.dataUrl)||(media.data_url)||(media.url))||''}
  function mediaMime(media){return String(media&&((media.mimeType)||(media.mime_type))||'')}
  function mediaForPost(post){const id=postMediaId(post);return(photos||[]).filter(media=>mediaItemId(media)===id&&mediaSource(media))}
  function visiblePosts(){return(state.freePosts||[]).filter(post=>role==='admin'||post.audienceRole===role).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0))}
  function isVideo(media){return mediaMime(media).startsWith('video/')||String(mediaSource(media)).startsWith('data:video/')}
  function extension(media){
    const type=mediaMime(media).toLowerCase();
    if(type.includes('png'))return'png';if(type.includes('webp'))return'webp';if(type.includes('webm'))return'webm';if(type.includes('quicktime'))return'mov';if(type.includes('mp4'))return'mp4';return isVideo(media)?'mp4':'jpg';
  }
  function safeName(value,fallback='media'){return String(value||fallback).replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,' ').trim().slice(0,70)||fallback}
  function downloadLink(src,name){const a=document.createElement('a');a.href=src;a.download=name;a.rel='noreferrer';document.body.appendChild(a);a.click();a.remove()}
  function loadZip(){
    if(window.JSZip)return Promise.resolve(window.JSZip);
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector(`script[src="${ZIP_LIB_URL}"]`);
      if(existing){existing.addEventListener('load',()=>resolve(window.JSZip),{once:true});existing.addEventListener('error',()=>reject(new Error('ZIP 라이브러리를 불러오지 못했습니다.')),{once:true});return}
      const script=document.createElement('script');script.src=ZIP_LIB_URL;script.onload=()=>window.JSZip?resolve(window.JSZip):reject(new Error('ZIP 라이브러리를 사용할 수 없습니다.'));script.onerror=()=>reject(new Error('ZIP 라이브러리를 불러오지 못했습니다.'));document.head.appendChild(script)
    })
  }
  function dataUrlBlob(dataUrl){
    const parts=String(dataUrl||'').split(',');if(parts.length<2)throw new Error('파일 데이터가 올바르지 않습니다.');
    const mime=parts[0].match(/data:([^;]+)/)?.[1]||'application/octet-stream';const binary=atob(parts.slice(1).join(','));const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type:mime})
  }
  async function sourceBlob(src){if(String(src).startsWith('data:'))return dataUrlBlob(src);const response=await fetch(src);if(!response.ok)throw new Error('파일을 불러오지 못했습니다.');return response.blob()}
  async function downloadAll(post,media,button){
    const old=button.textContent;button.disabled=true;button.textContent='ZIP 만드는 중...';
    try{
      const JSZip=await loadZip();const zip=new JSZip();const folder=zip.folder(safeName(`${post.author||'workshop'}_${post.createdAt||''}`,'workshop-post'));
      for(let i=0;i<media.length;i+=1){const file=media[i],name=safeName(file.fileName||file.file_name||`${isVideo(file)?'video':'photo'}_${i+1}`);folder.file(`${String(i+1).padStart(2,'0')}_${name}.${extension(file)}`,await sourceBlob(mediaSource(file)))}
      const blob=await zip.generateAsync({type:'blob'});const url=URL.createObjectURL(blob);downloadLink(url,`${safeName(post.author||'workshop')}-${safeName(post.id||'post')}-media.zip`);setTimeout(()=>URL.revokeObjectURL(url),1500)
    }catch(error){alert(`전체 다운로드 실패: ${error.message}`)}finally{button.disabled=false;button.textContent=old}
  }
  function addDownloadActions(card,post){
    if(!card||!post||card.querySelector('.post-media-downloads'))return;
    const media=mediaForPost(post);if(!media.length)return;
    const box=document.createElement('div');box.className='post-media-downloads';
    media.forEach((file,index)=>{const button=document.createElement('button');button.type='button';button.className='ghost small';button.textContent=`${isVideo(file)?'영상':'사진'} ${index+1} 저장`;button.onclick=()=>downloadLink(mediaSource(file),safeName(file.fileName||file.file_name||`${isVideo(file)?'video':'photo'}_${index+1}`)+'.'+extension(file));box.appendChild(button)});
    if(media.length>1){const all=document.createElement('button');all.type='button';all.className='ghost small';all.textContent=`첨부 ${media.length}개 전체 저장`;all.onclick=()=>downloadAll(post,media,all);box.appendChild(all)}
    const mediaBox=card.querySelector('.v2-media-carousel,.free-post-media-grid');if(mediaBox)mediaBox.insertAdjacentElement('afterend',box);else card.appendChild(box)
  }
  function decorateFreePostList(){
    const list=document.getElementById('freePostList');if(!list)return;const posts=visiblePosts().slice(0,12);Array.from(list.querySelectorAll('.free-post-card')).forEach((card,index)=>{const post=posts[index];if(post)addDownloadActions(card,post)})
  }
  function isAttachedPhotoItem(item,postMediaSources){return Boolean(item&&item.image&&postMediaSources.has(item.image))}
  function installStyle(){
    if(document.getElementById('postGroupStyle'))return;const style=document.createElement('style');style.id='postGroupStyle';style.textContent='.post-media-downloads{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.post-media-downloads button{min-height:38px;padding:8px 12px;font-size:12px}.free-post-card .timeline-thread{margin-top:12px}';document.head.appendChild(style)
  }
  function install(){
    if(window.__workshopPostGroupPatch)return true;
    if(typeof collectTimelineItems!=='function'||typeof renderTimelineCard!=='function'||typeof render!=='function'||!window.__workshopFreePostPatch||!window.__timelineThreadPatch)return false;
    installStyle();
    const oldCollect=collectTimelineItems;
    collectTimelineItems=function(){
      const sources=new Set((photos||[]).filter(media=>String(mediaItemId(media)).startsWith('fp:')).map(mediaSource).filter(Boolean));const seenPosts=new Set();
      return oldCollect().filter(item=>{
        if(isAttachedPhotoItem(item,sources))return false;
        if(item&&item.freePost){const id=String(item.freePost.id||'');if(seenPosts.has(id))return false;seenPosts.add(id)}
        return true
      })
    };
    const oldCard=renderTimelineCard;
    renderTimelineCard=function(box,item,compact=false){const before=box.children.length;const out=oldCard.apply(this,arguments);const card=box.children[before]||box.lastElementChild;if(card&&item&&item.freePost&&!compact)addDownloadActions(card,item.freePost);return out};
    const oldRender=render;
    render=function(){const out=oldRender.apply(this,arguments);setTimeout(decorateFreePostList,0);return out};
    window.__workshopPostGroupPatch=true;setTimeout(()=>{decorateFreePostList();if(token)render()},0);return true
  }
  if(!install()){const timer=setInterval(()=>{if(install())clearInterval(timer)},80);setTimeout(()=>clearInterval(timer),12000)}
})();