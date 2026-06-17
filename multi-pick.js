(()=>{
  function css(){
    if(document.getElementById('mpCss'))return;
    const s=document.createElement('style');
    s.id='mpCss';
    s.textContent=`
      .multi-pick-hint{display:block;margin-top:6px;color:var(--muted);font-size:12px;line-height:1.5}
      .multi-pick-count{display:inline-flex;margin-top:8px;padding:6px 10px;border-radius:999px;background:#fff1f2;color:#ee7985;font-size:12px;font-weight:800;border:1px solid #ffd0d6}
      .multi-pick-preview{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}
      .multi-pick-preview img,.multi-pick-preview video{width:100%;max-height:220px;object-fit:cover;border-radius:18px;border:1px solid var(--line);background:#000;box-shadow:var(--shadow-soft)}
      .multi-pick-preview video{object-fit:contain}
      @media(max-width:430px){.multi-pick-preview{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function previewElement(file){
    const url=URL.createObjectURL(file);
    const video=String(file.type||'').startsWith('video/')||/\.(mp4|webm|mov)$/i.test(file.name||'');
    let el;
    if(video){
      el=document.createElement('video');
      el.src=url;
      el.controls=true;
      el.preload='metadata';
    }else{
      el=document.createElement('img');
      el.src=url;
      el.alt=file.name||'선택한 사진';
      el.loading='lazy';
    }
    el.dataset.objectUrl=url;
    return el;
  }

  function clearPreview(box){
    if(!box)return;
    box.querySelectorAll('[data-object-url]').forEach(el=>{
      try{URL.revokeObjectURL(el.dataset.objectUrl)}catch(_){ }
    });
    box.replaceChildren();
  }

  function apply(){
    document.querySelectorAll('[data-post-files]').forEach(input=>{
      input.multiple=true;
      input.removeAttribute('capture');
      input.setAttribute('accept','image/*,video/mp4,video/webm,video/quicktime');

      const label=input.closest('label')||input.parentElement;
      if(!label)return;

      let hint=label.querySelector('.multi-pick-hint');
      if(!hint){
        hint=document.createElement('small');
        hint.className='multi-pick-hint';
        hint.textContent='사진은 여러 장을 한 번에 선택해서 올릴 수 있습니다. 선택한 사진과 영상은 아래에서 미리 확인할 수 있습니다.';
        label.appendChild(hint);
      }

      let count=label.querySelector('.multi-pick-count');
      if(!count){
        count=document.createElement('span');
        count.className='multi-pick-count';
        count.hidden=true;
        label.appendChild(count);
      }

      let preview=label.querySelector('.multi-pick-preview');
      if(!preview){
        preview=document.createElement('div');
        preview.className='multi-pick-preview';
        label.appendChild(preview);
      }

      input.onchange=()=>{
        const files=Array.from(input.files||[]);
        count.hidden=!files.length;
        count.textContent=`${files.length}개 선택됨`;
        clearPreview(preview);
        files.forEach(file=>preview.appendChild(previewElement(file)));
      };
    });
  }

  function boot(){
    if(window.__mp)return;
    if(typeof render!=='function')return setTimeout(boot,80);
    css();
    const oldRender=render;
    render=function(){
      const result=oldRender.apply(this,arguments);
      setTimeout(apply,0);
      return result;
    };
    window.__mp=1;
    apply();
  }

  boot();
})();