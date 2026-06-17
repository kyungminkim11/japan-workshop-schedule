(function boot(){
  if(window.__workshopQuickPostFab)return;
  if(typeof render!=='function')return setTimeout(boot,80);

  function openComposer(){
    const trigger=document.querySelector('#homeQuickPost button');
    if(trigger){trigger.click();return;}
    const modal=document.getElementById('quickComposerModal');
    if(modal){modal.hidden=false;document.body.style.overflow='hidden';return;}
    alert('새 소식 작성창을 불러오는 중입니다. 잠시 후 다시 눌러주세요.');
  }

  function mount(){
    let button=document.getElementById('quickPostFab');
    if(!token){if(button)button.hidden=true;return;}
    if(!button){
      button=document.createElement('button');
      button.id='quickPostFab';
      button.type='button';
      button.className='quick-post-fab';
      button.setAttribute('aria-label','새 소식 올리기');
      button.setAttribute('title','새 소식 올리기');
      button.innerHTML='<span aria-hidden="true">＋</span>';
      button.onclick=openComposer;
      document.body.appendChild(button);
    }
    button.hidden=false;
  }

  const style=document.createElement('style');
  style.id='quickPostFabStyle';
  style.textContent=`
    .quick-post-fab{
      position:fixed;
      right:max(18px,env(safe-area-inset-right));
      bottom:calc(92px + env(safe-area-inset-bottom));
      z-index:9990;
      width:62px;
      height:62px;
      min-height:62px;
      padding:0;
      border:1px solid rgba(255,255,255,.78);
      border-radius:50%;
      display:grid;
      place-items:center;
      background:linear-gradient(180deg,#ff9ba6,#ff7f8d)!important;
      color:#fff!important;
      box-shadow:0 14px 34px rgba(238,116,129,.38),0 4px 12px rgba(73,56,48,.16)!important;
      -webkit-tap-highlight-color:transparent;
      transition:transform .16s ease,box-shadow .16s ease,opacity .16s ease;
    }
    .quick-post-fab span{
      display:block;
      font-size:36px;
      font-weight:300;
      line-height:1;
      transform:translateY(-1px);
    }
    .quick-post-fab:active{
      transform:scale(.94);
      box-shadow:0 8px 22px rgba(238,116,129,.3)!important;
    }
    .quick-post-fab[hidden]{display:none!important}
    .quick-composer-modal:not([hidden])~.quick-post-fab{opacity:0;pointer-events:none}
    @media(min-width:780px){
      .quick-post-fab{right:calc((100vw - min(720px,100vw))/2 + 22px)}
    }
  `;
  document.head.appendChild(style);

  const oldRender=render;
  render=function(){const out=oldRender.apply(this,arguments);setTimeout(mount,0);return out};
  window.__workshopQuickPostFab=true;
  mount();
})();