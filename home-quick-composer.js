(function boot(){
  if(window.__homeQuickComposer)return;
  if(typeof render!=='function'||typeof rpc!=='function'||typeof resizeImage!=='function'||!window.__workshopFreePostPatch)return setTimeout(boot,80);
  const queue=[];let position=null,positionAt=0;
  const actualAdmin=()=>role==='admin'||storage.get('wkReal')==='admin'||Boolean(window.WorkshopV2&&WorkshopV2.actualRole&&WorkshopV2.actualRole()==='admin');
  const postItemId=id=>`fp:${String(id||'').slice(0,29)}`.slice(0,32);
  const fileKey=f=>`${f.name}|${f.size}|${f.lastModified}`;
  function author(){return storage.get(`workshopPostAuthor:${role||'guest'}`)||(actualAdmin()?'경민':'')||(window.WorkshopV2&&WorkshopV2.getProfile&&WorkshopV2.getProfile())||''}
  function addFiles(files){
    for(const file of Array.from(files||[])){
      if(queue.length>=12)break;if(queue.some(row=>row.key===fileKey(file)))continue;
      const video=String(file.type||'').startsWith('video/')||/\.(mp4|webm|mov)$/i.test(file.name||'');
      if(video&&file.size>4300000){alert(`${file.name}: 영상은 4MB 안팎의 짧은 파일만 가능합니다.`);continue}
      queue.push({key:fileKey(file),file,url:URL.createObjectURL(file),video});
    }
    drawQueue();
  }
  function clearQueue(){queue.splice(0).forEach(row=>URL.revokeObjectURL(row.url));drawQueue()}
  function drawQueue(){
    const box=document.querySelector('[data-quick-preview]'),count=document.querySelector('[data-quick-count]');if(!box)return;box.replaceChildren();if(count)count.textContent=`${queue.length}개 첨부`;
    queue.forEach((row,index)=>{const card=document.createElement('div');card.className='quick-attachment';let media;if(row.video){media=document.createElement('video');media.src=row.url;media.muted=true;media.preload='metadata'}else{media=document.createElement('img');media.src=row.url;media.alt=`선택한 사진 ${index+1}`}const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','첨부 삭제');remove.onclick=()=>{URL.revokeObjectURL(row.url);queue.splice(index,1);drawQueue()};card.append(media,remove);box.appendChild(card)})
  }
  function locate(force=false){
    const status=document.querySelector('[data-location-status]');if(!navigator.geolocation){if(status)status.textContent='이 브라우저에서는 위치를 사용할 수 없습니다.';return Promise.resolve(null)}
    if(!force&&position&&Date.now()-positionAt<60000)return Promise.resolve(position);
    if(status)status.textContent='현재 위치 확인 중...';
    return new Promise(resolve=>navigator.geolocation.getCurrentPosition(result=>{position={lat:result.coords.latitude,lng:result.coords.longitude,accuracy:Math.round(result.coords.accuracy||0)};positionAt=Date.now();if(status)status.textContent=`현재 위치 확인됨 · 정확도 약 ${position.accuracy}m`;resolve(position)},error=>{position=null;if(status)status.textContent=error.code===1?'위치 권한이 꺼져 있습니다.':'현재 위치를 확인하지 못했습니다.';resolve(null)},{enableHighAccuracy:true,timeout:12000,maximumAge:15000}))
  }
  function audience(){const select=document.querySelector('[data-quick-audience]');if(!actualAdmin())return role==='girlfriend'?'girlfriend':'family';return select?select.value:'both'}
  function audienceRoles(value){if(value==='both')return['family','girlfriend'];return[value]}
  function shareFlags(value){return{family:value==='both'||value==='family',girlfriend:value==='both'||value==='girlfriend'}}
  function withLocation(text){if(!position)return text;return `${text}${text?'\n\n':''}[[WORKSHOP_LOC:${position.lat.toFixed(6)},${position.lng.toFixed(6)},${position.accuracy}]]`}
  async function fileData(file){
    if(String(file.type||'').startsWith('image/'))return{dataUrl:await resizeImage(file),mimeType:'image/jpeg'};
    return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({dataUrl:reader.result,mimeType:file.type||(/\.webm$/i.test(file.name)?'video/webm':/\.mov$/i.test(file.name)?'video/quicktime':'video/mp4')});reader.onerror=()=>reject(new Error('파일을 읽지 못했습니다.'));reader.readAsDataURL(file)})
  }
  async function saveAdminPost(name,text,target){
    const id=makeId('p'),time=nowIso(),base={id,author:name,text,createdAt:time,updatedAt:time};
    state.freePosts=[...(state.freePosts||[]),...audienceRoles(target).map(audienceRole=>({...base,audienceRole}))];
    if(window.WorkshopV2&&WorkshopV2.saveAdminSnapshot)await WorkshopV2.saveAdminSnapshot();else await saveState();
    return base
  }
  async function submit(){
    const modal=document.getElementById('quickComposerModal'),name=safeText(modal.querySelector('[data-quick-author]').value).slice(0,40),raw=safeText(modal.querySelector('[data-quick-text]').value).slice(0,1800),msg=modal.querySelector('[data-quick-message]'),button=modal.querySelector('[data-quick-submit]'),useLocation=modal.querySelector('[data-use-location]').checked,target=audience();
    if(!name){msg.textContent='작성자 이름을 입력해주세요.';msg.className='message warn';return}if(!raw&&!queue.length){msg.textContent='글이나 사진을 추가해주세요.';msg.className='message warn';return}
    button.disabled=true;msg.textContent='소식을 올리는 중...';msg.className='message';
    try{
      if(useLocation)await locate(true);const text=withLocation(raw||'사진');storage.set(`workshopPostAuthor:${role||'guest'}`,name);let post;
      if(actualAdmin())post=await saveAdminPost(name,text,target);else{const result=await rpc('workshop_add_post',{p_token:token,p_author:name,p_text:text});if(!result||!result.ok)throw new Error(result&&result.message||'게시글 저장 실패');post=result.post;state.freePosts=[...(state.freePosts||[]),post]}
      const flags=shareFlags(target);
      for(let index=0;index<queue.length;index++){
        msg.textContent=`사진/영상 업로드 ${index+1}/${queue.length}`;const row=queue[index],data=await fileData(row.file),uploaded=await rpc('workshop_add_photo',{p_token:token,p_item_id:postItemId(post.id),p_file_name:row.file.name,p_mime_type:data.mimeType,p_data_url:data.dataUrl,p_shared_with_family:flags.family,p_shared_with_girlfriend:flags.girlfriend});if(!uploaded||!uploaded.ok)throw new Error(uploaded&&uploaded.message||'첨부 업로드 실패');photos.push(uploaded.photo)
      }
      clearQueue();modal.querySelector('[data-quick-text]').value='';msg.textContent='새 소식을 올렸습니다.';msg.className='message success';render();setTimeout(close,500);if(typeof flash==='function')flash('새 소식 업로드 완료')
    }catch(error){msg.textContent=error.message;msg.className='message error'}finally{button.disabled=false}
  }
  function linkLocations(){document.querySelectorAll('.free-post-card p').forEach(p=>{if(p.dataset.locationLinked)return;const text=p.textContent||'',match=text.match(/\[\[WORKSHOP_LOC:([-\d.]+),([-\d.]+),(\d+)\]\]/);if(!match)return;p.dataset.locationLinked='1';p.textContent=text.replace(match[0],'').trim();const link=document.createElement('a');link.className='quick-location-link';link.href=`https://maps.google.com/?q=${match[1]},${match[2]}`;link.target='_blank';link.rel='noreferrer';link.textContent=`📍 현재 위치 지도 열기 · 정확도 약 ${match[3]}m`;p.insertAdjacentElement('afterend',link)})}
  function open(){const modal=document.getElementById('quickComposerModal');modal.hidden=false;document.body.style.overflow='hidden';modal.querySelector('[data-quick-author]').value=author();if(modal.querySelector('[data-use-location]').checked)locate(false)}
  function close(){const modal=document.getElementById('quickComposerModal');if(!modal)return;modal.hidden=true;document.body.style.overflow='';modal.querySelector('[data-quick-message]').textContent=''}
  function build(){
    const app=document.getElementById('appPanel'),home=document.getElementById('homePanel'),old=document.getElementById('freePostPanel');if(old)old.style.display='none';if(!app||!home)return;
    if(!document.getElementById('homeQuickPost')){const card=document.createElement('section');card.id='homeQuickPost';card.className='panel home-quick-post';card.dataset.appView='home';card.innerHTML='<div><strong>사진과 소식을 바로 공유하세요</strong><p>촬영과 갤러리 사진을 섞어 올리고 현재 위치도 함께 남길 수 있습니다.</p></div><button type="button">＋ 새 소식 올리기</button>';card.querySelector('button').onclick=open;home.insertAdjacentElement('afterend',card)}
    if(document.getElementById('quickComposerModal'))return;
    const modal=document.createElement('div');modal.id='quickComposerModal';modal.className='quick-composer-modal';modal.hidden=true;modal.innerHTML=`<section class="quick-composer-sheet"><div class="quick-composer-head"><div><h2>새 소식 올리기</h2><p>사진을 찍거나 갤러리에서 골라 계속 추가하세요.</p></div><button type="button" data-close>×</button></div><label>작성자<input data-quick-author maxlength="40"></label><label class="quick-audience-wrap">보이는 사람<select data-quick-audience><option value="both">가족 + 여자친구</option><option value="family">가족만</option><option value="girlfriend">여자친구만</option><option value="admin">관리자만</option></select></label><label>글<textarea data-quick-text maxlength="1800" placeholder="지금 무엇을 하고 있는지 적어주세요."></textarea></label><div class="quick-media-buttons"><button type="button" data-camera>📷 사진 촬영</button><button type="button" class="ghost" data-gallery>🖼️ 갤러리 선택</button></div><input data-camera-input class="v2-hidden" type="file" accept="image/*" capture="environment"><input data-gallery-input class="v2-hidden" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple><div class="quick-preview-head"><strong data-quick-count>0개 첨부</strong><small>촬영 버튼을 반복해서 여러 장 추가할 수 있어요.</small></div><div class="quick-attachment-list" data-quick-preview></div><div class="quick-location-box"><label><input type="checkbox" data-use-location checked> 올리는 순간의 현재 위치 포함</label><button type="button" class="ghost small" data-locate>위치 새로고침</button><small data-location-status>위치 확인 전</small></div><button type="button" class="quick-submit" data-quick-submit>소식 올리기</button><p class="message" data-quick-message></p></section>`;
    document.body.appendChild(modal);modal.querySelector('[data-close]').onclick=close;modal.onclick=e=>{if(e.target===modal)close()};modal.querySelector('[data-camera]').onclick=()=>modal.querySelector('[data-camera-input]').click();modal.querySelector('[data-gallery]').onclick=()=>modal.querySelector('[data-gallery-input]').click();modal.querySelector('[data-camera-input]').onchange=e=>{addFiles(e.target.files);e.target.value=''};modal.querySelector('[data-gallery-input]').onchange=e=>{addFiles(e.target.files);e.target.value=''};modal.querySelector('[data-locate]').onclick=()=>locate(true);modal.querySelector('[data-quick-submit]').onclick=submit;
    if(!actualAdmin()){const wrap=modal.querySelector('.quick-audience-wrap');wrap.innerHTML=`보이는 사람<input value="${role==='girlfriend'?'여자친구 화면':'가족 화면'}" disabled>`}
  }
  const style=document.createElement('style');style.textContent=`.home-quick-post{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}.home-quick-post p{margin:5px 0 0;color:var(--muted);line-height:1.5}.home-quick-post>button{min-height:52px}.quick-composer-modal{position:fixed;inset:0;z-index:10050;display:grid;place-items:end center;background:rgba(48,40,35,.55);backdrop-filter:blur(7px)}.quick-composer-modal[hidden]{display:none}.quick-composer-sheet{width:min(680px,100%);max-height:94vh;overflow:auto;padding:20px;border-radius:28px 28px 0 0;background:var(--paper);box-shadow:0 -20px 60px rgba(40,30,25,.22);display:grid;gap:13px}.quick-composer-head{display:flex;justify-content:space-between;gap:12px}.quick-composer-head h2,.quick-composer-head p{margin:0}.quick-composer-head p{color:var(--muted);margin-top:4px}.quick-composer-head>[data-close]{width:44px;height:44px;padding:0;border-radius:50%;font-size:24px}.quick-media-buttons{display:grid;grid-template-columns:1fr 1fr;gap:9px}.quick-preview-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.quick-preview-head small{color:var(--muted)}.quick-attachment-list{display:flex;gap:9px;overflow-x:auto;padding-bottom:4px}.quick-attachment{position:relative;flex:0 0 112px;height:112px;border:1px solid var(--line);border-radius:17px;overflow:hidden;background:#111}.quick-attachment img,.quick-attachment video{width:100%;height:100%;object-fit:cover}.quick-attachment button{position:absolute;right:5px;top:5px;width:30px;height:30px;min-height:0;padding:0;border-radius:50%;background:rgba(40,32,28,.78)!important;color:#fff!important}.quick-location-box{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:17px;background:#fffaf7}.quick-location-box small{grid-column:1/-1;color:var(--muted)}.quick-location-link{display:inline-flex;margin-top:8px;padding:8px 11px;border-radius:14px;background:#fff1f2;color:#d86170;font-size:12px;font-weight:800}.quick-submit{min-height:54px}@media(max-width:540px){.home-quick-post{grid-template-columns:1fr}.home-quick-post>button{width:100%}.quick-composer-sheet{padding:17px}.quick-media-buttons{grid-template-columns:1fr 1fr}.quick-location-box{grid-template-columns:1fr}.quick-location-box button{width:100%}}`;document.head.appendChild(style);
  const oldRender=render;render=function(){const out=oldRender.apply(this,arguments);setTimeout(()=>{build();linkLocations();const old=document.getElementById('freePostPanel');if(old)old.style.display='none'},0);return out};window.__homeQuickComposer=true;build();linkLocations();
})();