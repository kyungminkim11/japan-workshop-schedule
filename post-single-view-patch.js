(function boot(){
  if(window.__workshopPostSingleView)return;
  if(typeof render!=='function'||!window.__workshopPostGroupPatch)return setTimeout(boot,80);
  function apply(){
    const list=document.getElementById('freePostList');
    if(list)list.hidden=true;
    const panel=document.getElementById('freePostPanel');
    if(!panel||panel.querySelector('.post-timeline-guide'))return;
    const note=document.createElement('p');
    note.className='muted post-timeline-guide';
    note.textContent='올린 글과 첨부 사진은 메인 타임라인에서 게시글 하나로 표시됩니다.';
    const form=panel.querySelector('.free-post-form');
    if(form)form.insertAdjacentElement('afterend',note);
  }
  const oldRender=render;
  render=function(){const out=oldRender.apply(this,arguments);setTimeout(apply,0);return out};
  const style=document.createElement('style');
  style.textContent='.post-timeline-guide{margin:4px 0 0;padding:10px 12px;border:1px dashed var(--line);border-radius:16px;background:#fffaf7}';
  document.head.appendChild(style);
  window.__workshopPostSingleView=true;
  apply();
  if(token)render();
})();