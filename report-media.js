(function workshopReportMedia(){
  if(window.__workshopReportMedia)return;
  window.__workshopReportMedia=true;

  const DB_NAME='workshopReportMediaV1';
  const STORE='queue';
  const MAX_FILES=12;
  const MAX_VIDEO_BYTES=4300000;
  let activeItemId='';
  let selected=[];
  let syncing=false;
  let openWrapped=null;
  let mountTimer=0;

  const uid=()=>crypto.randomUUID?crypto.randomUUID():`rm_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const mediaType=value=>String(value||'').startsWith('video/')?'video':'image';
  const fileType=file=>String(file?.type||'');

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'})};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }
  async function queuePut(value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
  async function queueAll(){const db=await openDb();return new Promise((resolve,reject)=>{const req=db.transaction(STORE).objectStore(STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)})}
  async function queueDelete(id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}

  function prepareFile(file){
    const type=fileType(file);
    if(type.startsWith('image/'))return resizeImage(file).then(dataUrl=>({dataUrl,mimeType:'image/jpeg'}));
    if(!(type.startsWith('video/')||/\.(mp4|webm|mov)$/i.test(file.name||'')))return Promise.reject(new Error(`${file.name}: 지원하지 않는 파일입니다.`));
    if(file.size>MAX_VIDEO_BYTES)return Promise.reject(new Error(`${file.name}: 영상은 4MB 안팎의 짧은 클립만 가능합니다.`));
    return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({dataUrl:reader.result,mimeType:type||(/\.webm$/i.test(file.name)?'video/webm':/\.mov$/i.test(file.name)?'video/quicktime':'video/mp4')});reader.onerror=()=>reject(new Error(`${file.name}: 파일을 읽지 못했습니다.`));reader.readAsDataURL(file)});
  }

  function reportMediaFor(itemId){return (Array.isArray(photos)?photos:[]).filter(media=>(media.itemId||media.item_id)===itemId)}
  function dialog(){return document.getElementById('reportProjectDialog')}
  function status(text,kind=''){const el=document.getElementById('reportMediaStatus');if(!el)return;el.textContent=text;el.className=`report-media-status ${kind}`}

  function ensureStyle(){
    if(document.getElementById('reportMediaStyle'))return;
    const style=document.createElement('style');
    style.id='reportMediaStyle';
    style.textContent=`
      .report-media-section{display:grid;gap:12px;margin-top:16px;padding:15px;border:1px solid #eadfd5;border-radius:22px;background:linear-gradient(145deg,#fff,#fff8f3)}
      .report-media-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.report-media-head h3{margin:0;font-size:17px}.report-media-head p{margin:4px 0 0;color:#7e7065;font-size:12px;line-height:1.5}
      .report-media-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.report-media-actions button{min-height:46px!important}
      .report-media-options{display:flex;gap:12px;flex-wrap:wrap;color:#6f6258;font-size:12px}.report-media-options label{display:flex;align-items:center;gap:6px}.report-media-options input{width:18px;height:18px;min-height:0!important}
      .report-media-selected,.report-media-existing,.report-media-pending{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .report-media-thumb{position:relative;overflow:hidden;min-height:108px;border:1px solid #eadfd5;border-radius:16px;background:#f1ebe6}.report-media-thumb img,.report-media-thumb video{display:block;width:100%;height:132px;object-fit:cover;background:#111}.report-media-thumb video{object-fit:contain}.report-media-thumb small{display:block;overflow:hidden;padding:7px 9px;color:#6e6259;font-size:10px;text-overflow:ellipsis;white-space:nowrap}
      .report-media-remove,.report-media-delete{position:absolute;top:6px;right:6px;z-index:2;display:grid;width:30px;min-height:30px!important;place-items:center;padding:0!important;border-radius:50%!important;background:rgba(45,35,30,.78)!important;color:#fff!important;font-size:14px!important}
      .report-media-upload{min-height:48px!important;background:linear-gradient(135deg,#b9775a,#995c43)!important;color:#fff!important}
      .report-media-status{margin:0;color:#786a60;font-size:12px;line-height:1.5}.report-media-status.success{color:#3e774e}.report-media-status.error{color:#b34f43}.report-media-status.warn{color:#a36a2d}
      .report-media-label{margin:3px 0 -2px;color:#55483f;font-size:13px;font-weight:900}
      .report-media-pending .report-media-thumb{border-style:dashed;border-color:#dfb58f;background:#fff8ef}
      @media(max-width:560px){.report-media-selected,.report-media-existing,.report-media-pending{grid-template-columns:repeat(2,minmax(0,1fr))}.report-media-actions{grid-template-columns:1fr 1fr}.report-media-thumb img,.report-media-thumb video{height:120px}}
    `;
    document.head.appendChild(style);
  }

  function ensureSection(){
    const d=dialog();if(!d)return null;
    let section=d.querySelector('#reportMediaSection');
    if(section)return section;
    section=document.createElement('section');
    section.id='reportMediaSection';
    section.className='report-media-section';
    section.innerHTML=`
      <div class="report-media-head"><div><h3>사진·동영상</h3><p>사진 여러 장과 짧은 동영상을 이 장소에 연결합니다. 오프라인에서도 저장 대기할 수 있습니다.</p></div><span id="reportMediaCount" class="report-summary-chip"></span></div>
      <div class="report-media-actions"><button type="button" id="reportGalleryBtn" class="ghost">갤러리에서 여러 개</button><button type="button" id="reportCameraBtn" class="ghost">카메라 촬영</button></div>
      <input id="reportGalleryInput" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple hidden>
      <input id="reportCameraInput" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" capture="environment" hidden>
      <div class="report-media-options"><label><input id="reportShareFamily" type="checkbox"> 가족 화면에도 공유</label><label><input id="reportShareGirlfriend" type="checkbox"> 여자친구 화면에도 공유</label></div>
      <div id="reportSelectedWrap" hidden><p class="report-media-label">선택한 파일</p><div id="reportMediaSelected" class="report-media-selected"></div><button type="button" id="reportMediaUploadBtn" class="report-media-upload">선택한 파일 업로드</button></div>
      <div id="reportPendingWrap" hidden><p class="report-media-label">오프라인 저장 대기</p><div id="reportMediaPending" class="report-media-pending"></div></div>
      <div><p class="report-media-label">등록된 사진·동영상</p><div id="reportMediaExisting" class="report-media-existing"></div></div>
      <p id="reportMediaStatus" class="report-media-status" role="status"></p>`;
    d.querySelector('.report-dialog-scroll')?.insertBefore(section,d.querySelector('#reportProjectForm'));
    section.querySelector('#reportGalleryBtn').onclick=()=>section.querySelector('#reportGalleryInput').click();
    section.querySelector('#reportCameraBtn').onclick=()=>section.querySelector('#reportCameraInput').click();
    section.querySelector('#reportGalleryInput').onchange=e=>addFiles(e.target.files);
    section.querySelector('#reportCameraInput').onchange=e=>addFiles(e.target.files);
    section.querySelector('#reportMediaUploadBtn').onclick=uploadSelected;
    return section;
  }

  function addFiles(fileList){
    const incoming=Array.from(fileList||[]);
    const map=new Map(selected.map(file=>[`${file.name}:${file.size}:${file.lastModified}`,file]));
    incoming.forEach(file=>map.set(`${file.name}:${file.size}:${file.lastModified}`,file));
    selected=Array.from(map.values()).slice(0,MAX_FILES);
    renderSelected();
    if(incoming.length+map.size>MAX_FILES)status(`한 번에 최대 ${MAX_FILES}개까지 선택할 수 있습니다.`,'warn');
  }

  function createThumb(src,mime,name,remove){
    const box=document.createElement('figure');box.className='report-media-thumb';
    const media=mediaType(mime)==='video'?document.createElement('video'):document.createElement('img');
    media.src=src;mediaType(mime)==='video'?(media.controls=true,media.preload='metadata'):(media.alt=name||'보고서 사진',media.loading='lazy');
    box.appendChild(media);
    if(remove){const button=document.createElement('button');button.type='button';button.className='report-media-remove';button.textContent='×';button.onclick=remove;box.appendChild(button)}
    const caption=document.createElement('small');caption.textContent=name||'첨부 파일';box.appendChild(caption);
    return box;
  }

  function renderSelected(){
    const section=ensureSection();if(!section)return;
    const wrap=section.querySelector('#reportSelectedWrap');const box=section.querySelector('#reportMediaSelected');box.replaceChildren();
    selected.forEach((file,index)=>{const url=URL.createObjectURL(file);const thumb=createThumb(url,file.type,file.name,()=>{URL.revokeObjectURL(url);selected.splice(index,1);renderSelected()});box.appendChild(thumb)});
    wrap.hidden=!selected.length;
    section.querySelector('#reportGalleryInput').value='';section.querySelector('#reportCameraInput').value='';
  }

  async function renderPending(){
    const section=ensureSection();if(!section)return;
    const all=(await queueAll()).filter(item=>item.itemId===activeItemId);
    const wrap=section.querySelector('#reportPendingWrap');const box=section.querySelector('#reportMediaPending');box.replaceChildren();
    all.forEach(item=>box.appendChild(createThumb(item.dataUrl,item.mimeType,item.fileName,async()=>{await queueDelete(item.id);renderPending()})));
    wrap.hidden=!all.length;
  }

  function renderExisting(){
    const section=ensureSection();if(!section||!activeItemId)return;
    const items=reportMediaFor(activeItemId);const box=section.querySelector('#reportMediaExisting');box.replaceChildren();
    items.forEach(item=>{
      const src=item.dataUrl||item.data_url;if(!src)return;
      const thumb=createThumb(src,item.mimeType||item.mime_type,item.fileName||item.file_name);
      const del=document.createElement('button');del.type='button';del.className='report-media-delete';del.textContent='삭제';del.title='첨부 삭제';
      del.onclick=async()=>{if(!confirm('이 사진 또는 동영상을 삭제할까요?'))return;try{del.disabled=true;const result=await rpc('workshop_delete_photo',{p_token:token,p_photo_id:item.id});if(!result?.ok)throw new Error(result?.message||'삭제 실패');photos=photos.filter(photo=>photo.id!==item.id);renderExisting();status('첨부를 삭제했습니다.','success')}catch(error){status(error.message,'error');del.disabled=false}};
      thumb.appendChild(del);box.appendChild(thumb);
    });
    section.querySelector('#reportMediaCount').textContent=`${items.length}개`;
    const linked=dialog()?.querySelector('#reportLinkedStats span:first-child strong');if(linked)linked.textContent=String(items.length);
    if(!items.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='아직 등록된 사진이나 동영상이 없습니다.';box.appendChild(empty)}
  }

  async function uploadPrepared(item){
    const result=await rpc('workshop_add_photo',{p_token:token,p_item_id:item.itemId,p_file_name:item.fileName,p_mime_type:item.mimeType,p_data_url:item.dataUrl,p_shared_with_family:item.sharedFamily,p_shared_with_girlfriend:item.sharedGirlfriend});
    if(!result?.ok)throw new Error(result?.message||'첨부 업로드 실패');
    photos.push(result.photo);
  }

  async function uploadSelected(){
    if(!activeItemId||!selected.length||syncing)return;
    syncing=true;
    const section=ensureSection();const button=section.querySelector('#reportMediaUploadBtn');button.disabled=true;
    const family=section.querySelector('#reportShareFamily').checked;const girlfriend=section.querySelector('#reportShareGirlfriend').checked;
    try{
      const files=[...selected];
      for(let index=0;index<files.length;index++){
        status(`${index+1}/${files.length} 파일 준비 중...`);
        const prepared=await prepareFile(files[index]);
        const item={id:uid(),itemId:activeItemId,fileName:files[index].name,mimeType:prepared.mimeType,dataUrl:prepared.dataUrl,sharedFamily:family,sharedGirlfriend:girlfriend,createdAt:new Date().toISOString()};
        if(navigator.onLine){status(`${index+1}/${files.length} 업로드 중...`);await uploadPrepared(item)}else{await queuePut(item)}
      }
      selected=[];renderSelected();renderExisting();await renderPending();
      status(navigator.onLine?'사진·동영상 업로드를 완료했습니다.':'오프라인 저장 완료 · 인터넷 연결 시 자동 업로드됩니다.','success');
      if(typeof render==='function'&&navigator.onLine)render();
    }catch(error){status(error.message,'error')}finally{syncing=false;button.disabled=false}
  }

  async function syncQueue(){
    if(syncing||!navigator.onLine||role!=='admin'||!token)return;
    const all=await queueAll();if(!all.length)return;
    syncing=true;
    try{
      for(let index=0;index<all.length;index++){
        status(`오프라인 첨부 ${index+1}/${all.length} 동기화 중...`);
        await uploadPrepared(all[index]);await queueDelete(all[index].id);
      }
      renderExisting();await renderPending();status('오프라인 사진·동영상 동기화를 완료했습니다.','success');
      if(typeof render==='function')render();
    }catch(error){status(`동기화 대기: ${error.message}`,'error')}finally{syncing=false}
  }

  function patchOpen(){
    const current=window.WorkshopReports?.open;
    if(!current||current.__reportMediaWrapped)return;
    const wrapped=function(id){activeItemId=id;selected=[];const result=current.apply(this,arguments);setTimeout(()=>{ensureSection();renderSelected();renderExisting();renderPending();syncQueue()},80);return result};
    wrapped.__reportMediaWrapped=true;wrapped.__reportMediaOriginal=current;window.WorkshopReports.open=wrapped;openWrapped=wrapped;
  }

  function scheduleMount(){clearTimeout(mountTimer);mountTimer=setTimeout(()=>{patchOpen();if(dialog()?.open&&activeItemId){ensureSection();renderExisting();renderPending()}},80)}

  function boot(){
    if(typeof rpc!=='function'||!document.getElementById('appPanel')){setTimeout(boot,80);return}
    ensureStyle();patchOpen();
    new MutationObserver(scheduleMount).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('online',syncQueue);
    navigator.storage?.persist?.().catch(()=>{});
    window.WorkshopReportMedia={sync:syncQueue,render:()=>{renderExisting();renderPending()}};
    setInterval(()=>{if(window.WorkshopReports?.open!==openWrapped)patchOpen()},900);
    if(navigator.onLine)setTimeout(syncQueue,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
