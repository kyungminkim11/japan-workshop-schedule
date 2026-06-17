(function(){
  const V2=window.WorkshopV2;if(!V2)return;
  let session={total:0,done:0,failed:0};
  const DB='workshop-v2-uploads',STORE='queue';
  function db(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
  async function queuePut(args,error){const d=await db(),tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id:`q_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,args,createdAt:new Date().toISOString(),error:String(error&&error.message||error||'업로드 실패')});return new Promise((r,j)=>{tx.oncomplete=r;tx.onerror=()=>j(tx.error)})}
  async function queueAll(){const d=await db(),tx=d.transaction(STORE,'readonly'),req=tx.objectStore(STORE).getAll();return new Promise((r,j)=>{req.onsuccess=()=>r(req.result||[]);req.onerror=()=>j(req.error)})}
  async function queueDelete(id){const d=await db(),tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);return new Promise((r,j)=>{tx.oncomplete=r;tx.onerror=()=>j(tx.error)})}
  function panel(){
    const host=document.querySelector('#freePostPanel .free-post-form');if(!host)return null;
    let box=host.querySelector('.v2-upload-status');
    if(!box){box=document.createElement('div');box.className='v2-upload-status';box.hidden=true;box.innerHTML='<strong data-upload-title>업로드 준비</strong><div class="v2-progress-track"><span></span></div><small data-upload-sub class="muted"></small><div class="v2-retry-list"></div><button type="button" class="ghost" data-retry-all hidden>실패 파일 다시 올리기</button>';host.appendChild(box);box.querySelector('[data-retry-all]').onclick=retryAll}
    return box;
  }
  function progress(text){
    const box=panel();if(!box)return;box.hidden=false;const total=Math.max(1,session.total),pct=Math.min(100,Math.round((session.done+session.failed)/total*100));box.querySelector('[data-upload-title]').textContent=text||`업로드 중 ${session.done+session.failed}/${session.total}`;box.querySelector('.v2-progress-track span').style.width=`${pct}%`;box.querySelector('[data-upload-sub]').textContent=session.failed?`${session.failed}개 실패 · 대기 목록에 저장됨`:`${session.done}개 완료`;
  }
  async function refreshQueue(){
    const box=panel();if(!box)return;const list=box.querySelector('.v2-retry-list'),items=await queueAll().catch(()=>[]);list.replaceChildren();
    items.slice(0,8).forEach(item=>{const row=document.createElement('div');row.className='v2-retry-item';const name=document.createElement('span');name.textContent=item.args&&item.args.p_file_name||'대기 파일';const b=document.createElement('button');b.type='button';b.className='ghost small';b.textContent='재시도';b.onclick=()=>retryOne(item,b);row.append(name,b);list.appendChild(row)});
    box.querySelector('[data-retry-all]').hidden=!items.length;if(items.length)box.hidden=false;
  }
  async function retryOne(item,button){
    button.disabled=true;button.textContent='업로드 중';
    try{const result=await V2.rawRpc('workshop_add_photo',item.args);if(!result||!result.ok)throw new Error(result&&result.message||'재시도 실패');if(result.photo)photos.push(result.photo);await queueDelete(item.id);if(typeof render==='function')render()}catch(e){alert(`재시도 실패: ${e.message}`)}finally{button.disabled=false;button.textContent='재시도';refreshQueue()}
  }
  async function retryAll(){const items=await queueAll().catch(()=>[]);for(const item of items){try{const r=await V2.rawRpc('workshop_add_photo',item.args);if(r&&r.ok){if(r.photo)photos.push(r.photo);await queueDelete(item.id)}}catch{}}refreshQueue();if(typeof render==='function')render()}
  function bindSubmit(){
    const form=document.querySelector('#freePostPanel .free-post-form');if(!form||form.dataset.v2Progress)return;form.dataset.v2Progress='1';form.addEventListener('submit',()=>{const input=form.querySelector('[data-post-files]');session={total:(input&&input.files&&input.files.length)||0,done:0,failed:0};if(session.total)progress(`업로드 준비 · ${session.total}개`)},true)
  }
  V2.useRpc(async(next,name,args)=>{
    if(name!=='workshop_add_photo'||!String(args&&args.p_item_id||'').startsWith('fp:'))return next(name,args);
    try{const result=await next(name,args);session.done+=1;progress(`업로드 중 ${session.done+session.failed}/${session.total||session.done}`);if(session.total&&session.done+session.failed>=session.total)setTimeout(()=>{const box=panel();if(box&&!session.failed)box.hidden=true},900);return result}
    catch(error){session.failed+=1;await queuePut(args,error).catch(()=>{});progress(`업로드 중 ${session.done+session.failed}/${session.total||session.done+session.failed}`);refreshQueue();throw error}
  });
  function lightbox(){
    let box=document.getElementById('v2Lightbox');if(box)return box;
    box=document.createElement('div');box.id='v2Lightbox';box.className='media-lightbox';box.hidden=true;box.innerHTML='<div class="media-lightbox-inner"><button class="media-lightbox-close" type="button">×</button><div data-v2-lightbox></div><div class="v2-lightbox-actions"><a download target="_blank" rel="noreferrer">원본 열기/저장</a></div></div>';document.body.appendChild(box);
    const close=()=>{box.hidden=true;box.querySelector('[data-v2-lightbox]').replaceChildren();document.body.style.overflow=''};box.querySelector('button').onclick=close;box.onclick=e=>{if(e.target===box)close()};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!box.hidden)close()});return box
  }
  V2.openMedia=(src,type='image',name='workshop-media')=>{const box=lightbox(),wrap=box.querySelector('[data-v2-lightbox]');wrap.replaceChildren();let el;if(type==='video'||String(src).startsWith('data:video/')){el=document.createElement('video');el.src=src;el.controls=true;el.autoplay=true;el.playsInline=true}else{el=document.createElement('img');el.src=src;el.alt=name}wrap.appendChild(el);const a=box.querySelector('a');a.href=src;a.download=name;box.hidden=false;document.body.style.overflow='hidden'};
  function bindMedia(root=document){
    root.querySelectorAll('.timeline-card img,.free-post-card img,.v2-album-item img').forEach(img=>{if(img.dataset.v2Zoom)return;img.dataset.v2Zoom='1';img.onclick=()=>V2.openMedia(img.currentSrc||img.src,'image',img.alt||'photo.jpg')});
    root.querySelectorAll('.timeline-card video,.free-post-card video,.v2-album-item video').forEach(video=>{if(video.dataset.v2Zoom)return;video.dataset.v2Zoom='1';video.ondblclick=()=>V2.openMedia(video.currentSrc||video.src,'video','video.mp4')});
  }
  function carousel(grid){
    if(!grid||grid.dataset.v2Carousel)return;const items=Array.from(grid.children).filter(el=>/^(IMG|VIDEO)$/.test(el.tagName));if(items.length<2){grid.querySelectorAll('img,video').forEach(el=>{el.style.height='auto';el.style.maxHeight='75vh';el.style.objectFit='contain'});return}
    grid.dataset.v2Carousel='1';const shell=document.createElement('div');shell.className='v2-media-carousel';const track=document.createElement('div');track.className='v2-media-track';let index=0;
    items.forEach(el=>{const slide=document.createElement('div');slide.className='v2-media-slide';slide.appendChild(el);track.appendChild(slide)});shell.appendChild(track);
    const prev=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span'),dots=document.createElement('div');prev.type=next.type='button';prev.className='v2-carousel-btn v2-carousel-prev';next.className='v2-carousel-btn v2-carousel-next';prev.textContent='‹';next.textContent='›';count.className='v2-carousel-count';dots.className='v2-carousel-dots';
    items.forEach((_,i)=>{const d=document.createElement('button');d.type='button';d.className='v2-carousel-dot';d.onclick=()=>show(i);dots.appendChild(d)});
    function show(i){index=(i+items.length)%items.length;track.style.transform=`translateX(-${index*100}%)`;count.textContent=`${index+1} / ${items.length}`;Array.from(dots.children).forEach((d,j)=>d.classList.toggle('active',j===index))}
    prev.onclick=()=>show(index-1);next.onclick=()=>show(index+1);shell.append(prev,next,count,dots);grid.replaceWith(shell);show(0);let start=0;shell.addEventListener('touchstart',e=>start=e.touches[0].clientX,{passive:true});shell.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-start;if(Math.abs(dx)>45)show(index+(dx<0?1:-1))},{passive:true})
  }
  function enhance(){document.querySelectorAll('.free-post-media-grid').forEach(carousel);bindMedia();bindSubmit();refreshQueue()}
  V2.onRender(enhance);V2.onTimelineCard(card=>{if(card)setTimeout(()=>bindMedia(card),0)});window.addEventListener('online',retryAll);setTimeout(enhance,0);
})();