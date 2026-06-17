(()=>{
  const ROLE_LABEL={admin:'관리자',family:'가족',girlfriend:'여자친구'};
  const AUTHOR_KEY='workshopCommentAuthor:';
  function css(){
    if(document.getElementById('ttCss'))return;
    const s=document.createElement('style');
    s.id='ttCss';
    s.textContent=`
      .timeline-card>img,.timeline-card .free-post-media-grid img,.free-post-card .free-post-media-grid img{width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;background:#fffaf7!important;cursor:zoom-in}
      .timeline-card>video,.timeline-card .free-post-media-grid video,.free-post-card .free-post-media-grid video{width:100%!important;height:auto!important;max-height:75vh!important;object-fit:contain!important;background:#111!important}
      .media-lightbox{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:18px;background:rgba(35,29,25,.86);backdrop-filter:blur(8px)}
      .media-lightbox[hidden]{display:none}
      .media-lightbox-inner{position:relative;width:min(1100px,100%);max-height:94vh;display:grid;place-items:center}
      .media-lightbox img,.media-lightbox video{display:block;max-width:100%;max-height:90vh;width:auto;height:auto;object-fit:contain;border-radius:18px;background:#111;box-shadow:0 18px 70px rgba(0,0,0,.38)}
      .media-lightbox-close{position:absolute;top:10px;right:10px;z-index:2;width:44px;height:44px;padding:0;border-radius:50%;background:rgba(255,255,255,.94)!important;color:#4b4038!important;font-size:24px;box-shadow:0 8px 24px rgba(0,0,0,.2)!important}
      .timeline-thread{display:grid;gap:9px;margin-top:14px;padding-top:13px;border-top:1px dashed var(--line)}
      .timeline-thread-title{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:13px;color:var(--muted)}
      .timeline-thread-list{display:grid;gap:7px}
      .timeline-thread-comment{padding:9px 11px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.82)}
      .timeline-thread-comment strong{font-size:13px;color:var(--text)}
      .timeline-thread-comment small{margin-left:6px;color:var(--muted)}
      .timeline-thread-comment p{margin:5px 0 0;white-space:pre-wrap;line-height:1.55;font-size:14px}
      .timeline-thread-form{display:grid;grid-template-columns:minmax(90px,.42fr) minmax(0,1fr) auto;gap:7px;align-items:end}
      .timeline-thread-form input{min-width:0}
      .timeline-thread-form button{min-height:46px;padding-inline:14px}
      .timeline-thread-message{grid-column:1/-1;margin:0;font-size:12px}
      @media(max-width:560px){.timeline-thread-form{grid-template-columns:1fr}.timeline-thread-form button{width:100%}}
    `;
    document.head.appendChild(s);
  }
  function lightbox(){
    let box=document.getElementById('mediaLightbox');
    if(box)return box;
    box=document.createElement('div');
    box.id='mediaLightbox';
    box.className='media-lightbox';
    box.hidden=true;
    box.innerHTML='<div class="media-lightbox-inner"><button class="media-lightbox-close" type="button" aria-label="닫기">×</button><div data-lightbox-content></div></div>';
    document.body.appendChild(box);
    const close=()=>{box.hidden=true;const c=box.querySelector('[data-lightbox-content]');c.replaceChildren();document.body.style.overflow=''};
    box.querySelector('.media-lightbox-close').onclick=close;
    box.addEventListener('click',e=>{if(e.target===box)close()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!box.hidden)close()});
    box.closeBox=close;
    return box;
  }
  function openMedia(el){
    const box=lightbox();
    const content=box.querySelector('[data-lightbox-content]');
    content.replaceChildren();
    let copy;
    if(el.tagName==='VIDEO'){
      copy=document.createElement('video');copy.src=el.currentSrc||el.src;copy.controls=true;copy.autoplay=true;copy.playsInline=true;
    }else{
      copy=document.createElement('img');copy.src=el.currentSrc||el.src;copy.alt=el.alt||'사진 크게 보기';
    }
    content.appendChild(copy);box.hidden=false;document.body.style.overflow='hidden';
  }
  function bindZoom(root=document){
    root.querySelectorAll('.timeline-card img,.free-post-card img').forEach(el=>{
      if(el.dataset.zoomBound)return;el.dataset.zoomBound='1';el.title='눌러서 크게 보기';el.addEventListener('click',()=>openMedia(el));el.addEventListener('dblclick',()=>openMedia(el));
    });
    root.querySelectorAll('.timeline-card video,.free-post-card video').forEach(el=>{
      if(el.dataset.zoomBound)return;el.dataset.zoomBound='1';el.title='두 번 눌러서 크게 보기';el.addEventListener('dblclick',()=>openMedia(el));
    });
  }
  function postThreadId(post){return `fp:${String(post&&post.id||'').slice(0,29)}`.slice(0,32)}
  function photoThreadId(item){
    if(!item||!item.image)return'';
    const p=(photos||[]).find(x=>(x.dataUrl||x.data_url)===item.image);
    if(!p)return'';
    return `ph:${String(p.id||'').replace(/-/g,'').slice(0,29)}`.slice(0,32);
  }
  function canSee(c){return role==='admin'||c.audienceRole===role}
  function commentsFor(id){return(state.commentEntries||[]).filter(c=>canSee(c)&&c.itemId===id).sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0))}
  function authorValue(){return storage.get(AUTHOR_KEY+(role||'guest'))||(role==='admin'?'경민':'')}
  function renderThread(card,id){
    if(!card||!id||card.querySelector('.timeline-thread'))return;
    const section=document.createElement('section');section.className='timeline-thread';
    const title=document.createElement('div');title.className='timeline-thread-title';
    const list=document.createElement('div');list.className='timeline-thread-list';
    const comments=commentsFor(id);
    title.innerHTML=`<strong>댓글 ${comments.length}개</strong><span>${role==='admin'?'전체 확인 가능':(ROLE_LABEL[role]||role)+'끼리 표시'}</span>`;
    if(!comments.length){const e=document.createElement('p');e.className='muted';e.textContent='아직 댓글이 없습니다.';list.appendChild(e)}
    comments.forEach(c=>{
      const row=document.createElement('article');row.className='timeline-thread-comment';
      const head=document.createElement('div');const name=document.createElement('strong');name.textContent=c.author||ROLE_LABEL[c.audienceRole]||'작성자';const time=document.createElement('small');time.textContent=fmt(c.createdAt);head.append(name,time);
      const text=document.createElement('p');text.textContent=c.text;row.append(head,text);list.appendChild(row);
    });
    const form=document.createElement('form');form.className='timeline-thread-form';
    const author=document.createElement('input');author.placeholder='작성자';author.value=authorValue();author.maxLength=40;
    const text=document.createElement('input');text.placeholder='댓글을 입력하세요';text.maxLength=1000;
    const button=document.createElement('button');button.type='submit';button.textContent='댓글';
    const msg=document.createElement('p');msg.className='message timeline-thread-message';
    form.append(author,text,button,msg);
    form.onsubmit=async e=>{
      e.preventDefault();const a=safeText(author.value).slice(0,40),t=safeText(text.value).slice(0,1000);
      if(!a){msg.textContent='작성자 이름을 입력해주세요.';msg.className='message warn timeline-thread-message';return}
      if(!t){msg.textContent='댓글 내용을 입력해주세요.';msg.className='message warn timeline-thread-message';return}
      try{
        button.disabled=true;msg.textContent='저장 중...';msg.className='message timeline-thread-message';storage.set(AUTHOR_KEY+(role||'guest'),a);
        const r=await rpc('workshop_add_comment',{p_token:token,p_author:a,p_text:t,p_item_id:id});
        if(!r||!r.ok)throw new Error(r&&r.message?r.message:'댓글 저장 실패');
        state.commentEntries=[...(state.commentEntries||[]),r.comment];text.value='';render();
      }catch(err){msg.textContent=err.message;msg.className='message error timeline-thread-message'}finally{button.disabled=false}
    };
    section.append(title,list,form);card.appendChild(section);
  }
  function enhanceFreePostList(){
    const list=document.getElementById('freePostList');if(!list)return;
    const posts=(state.freePosts||[]).filter(p=>role==='admin'||p.audienceRole===role).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,12);
    Array.from(list.querySelectorAll('.free-post-card')).forEach((card,i)=>{const p=posts[i];if(p)renderThread(card,postThreadId(p))});
    bindZoom(list);
  }
  function install(){
    if(window.__timelineThreadPatch)return true;
    if(typeof renderTimelineCard!=='function'||typeof collectTimelineItems!=='function'||typeof render!=='function')return false;
    css();lightbox();
    const oldCollect=collectTimelineItems;
    collectTimelineItems=function(){
      return oldCollect().filter(item=>!(item.commentEntry&&/^(fp|ph):/.test(item.commentEntry.itemId||''))).map(item=>{
        if(item.freePost)item._threadId=postThreadId(item.freePost);else if(item.image)item._threadId=photoThreadId(item);return item;
      });
    };
    const oldCard=renderTimelineCard;
    renderTimelineCard=function(box,item,compact=false){
      oldCard.apply(this,arguments);
      const card=box.lastElementChild;
      if(card&&!compact&&item&&item._threadId)renderThread(card,item._threadId);
      if(card)bindZoom(card);
    };
    const oldRender=render;
    render=function(){const out=oldRender.apply(this,arguments);setTimeout(()=>{bindZoom();enhanceFreePostList()},0);return out};
    window.__timelineThreadPatch=true;
    setTimeout(()=>{bindZoom();enhanceFreePostList();if(typeof render==='function')render()},0);
    return true;
  }
  if(!install()){
    const t=setInterval(()=>{if(install())clearInterval(t)},80);
    setTimeout(()=>clearInterval(t),10000);
  }
})();