(function workshopReportBottomTab(){
  if(window.__workshopReportBottomTab)return;
  window.__workshopReportBottomTab=true;

  let originalSync=null;
  let originalRender=null;
  let timer=0;
  let applying=false;

  function loadAllPlaces(){
    if(document.querySelector('script[src*="report-all-places.js"]'))return;
    const script=document.createElement('script');
    script.src='report-all-places.js?v=20260620-places-1';
    script.async=false;
    document.head.appendChild(script);
  }

  function installStyle(){
    if(document.getElementById('reportTabStyle'))return;
    const style=document.createElement('style');
    style.id='reportTabStyle';
    style.textContent=`
      #bottomNav.has-report-tab{grid-template-columns:repeat(5,minmax(0,1fr))!important}
      #reportNavButton{position:relative}
      #reportNavButton .report-nav-badge{position:absolute;top:5px;left:calc(50% + 9px);display:grid;min-width:16px;height:16px;place-items:center;padding:0 4px;border:2px solid #fff;border-radius:999px;background:#e97967;color:#fff;font-size:9px;font-weight:900;line-height:1}
      #reportNavButton .report-nav-badge:empty{display:none}
      body[data-active-view="reports"] #quickPostFab,body[data-active-view="reports"] #quickPostFabFallback{display:none!important}
      body[data-active-view="reports"] #reportProjectPanel{margin-top:10px}
      @media(max-width:390px){#bottomNav.has-report-tab{gap:2px!important;padding-inline:5px!important}#bottomNav.has-report-tab button{font-size:10px!important;padding-inline:1px!important}#bottomNav.has-report-tab .nav-icon{font-size:19px!important}}
    `;
    document.head.appendChild(style);
  }

  function panel(){return document.getElementById('reportProjectPanel')}
  function button(){return document.getElementById('reportNavButton')}
  function setHidden(el,value){if(el&&el.hidden!==value)el.hidden=value}

  function ensureButton(){
    const nav=document.getElementById('bottomNav');
    if(!nav)return null;
    if(role!=='admin'){
      button()?.remove();
      nav.classList.remove('has-report-tab');
      if(activeView==='reports'){activeView='home';storage.set('workshopView','home')}
      return null;
    }
    let tab=button();
    if(!tab){
      tab=document.createElement('button');
      tab.id='reportNavButton';
      tab.type='button';
      tab.dataset.view='reports';
      tab.innerHTML='<span class="nav-icon">▤</span><span>보고서</span><span class="report-nav-badge" aria-hidden="true"></span>';
      nav.insertBefore(tab,nav.querySelector('[data-view="settings"]'));
      tab.addEventListener('click',openReports);
    }
    nav.classList.add('has-report-tab');
    return tab;
  }

  function updateHeading(){
    if(activeView!=='reports')return;
    const heading=document.getElementById('uxViewHeading');
    if(!heading)return;
    const eyebrow=heading.querySelector('.ux-view-eyebrow');
    const title=heading.querySelector('h2');
    const text=heading.querySelector('p');
    if(eyebrow)eyebrow.textContent='REPORT';
    if(title)title.textContent='전체 워크샵 보고서';
    if(text)text.textContent='타임라인과 일정표의 모든 장소에 코멘트를 작성하세요.';
    heading.dataset.view='reports';
  }

  function updateBadge(){
    const tab=button();
    const root=panel();
    if(!tab||!root)return;
    const cards=Array.from(root.querySelectorAll('.report-project-card'));
    const unfinished=cards.filter(card=>!card.classList.contains('status-done')).length;
    const badge=tab.querySelector('.report-nav-badge');
    if(badge)badge.textContent=unfinished?String(Math.min(unfinished,99)):'';
    tab.setAttribute('aria-label',unfinished?`보고서, 미완료 ${unfinished}개`:'보고서, 모두 작성 완료');
  }

  function applyView(){
    if(applying)return;
    applying=true;
    try{
      const root=panel();
      const tab=ensureButton();
      if(root)root.dataset.appView='reports';
      if(role!=='admin'){setHidden(root,true);return}
      document.querySelectorAll('#bottomNav [data-view]').forEach(item=>{
        const selected=item.dataset.view===activeView;
        item.classList.toggle('active',selected);
        item.setAttribute('aria-current',selected?'page':'false');
      });
      if(activeView==='reports'){
        document.body.dataset.activeView='reports';
        document.querySelectorAll('[data-app-view]').forEach(el=>{
          const views=String(el.dataset.appView||'').split(/\s+/).filter(Boolean);
          setHidden(el,!views.includes('reports'));
        });
        setHidden(root,false);
        updateHeading();
        window.WorkshopReports?.renderAllPlaces?.();
      }
      if(tab)updateBadge();
    }finally{applying=false}
  }

  function openReports(){
    if(role!=='admin')return;
    activeView='reports';
    storage.set('workshopView','reports');
    window.WorkshopReports?.render?.();
    window.WorkshopReports?.renderAllPlaces?.();
    if(originalSync)originalSync();
    applyView();
    requestAnimationFrame(()=>{applyView();window.scrollTo({top:0,left:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})});
  }

  function scheduleApply(){clearTimeout(timer);timer=setTimeout(applyView,70)}

  function patchCore(){
    if(typeof syncAppView==='function'&&!originalSync){
      originalSync=syncAppView;
      syncAppView=function(){const result=originalSync.apply(this,arguments);applyView();return result};
    }
    if(typeof render==='function'&&!originalRender){
      originalRender=render;
      render=function(){const result=originalRender.apply(this,arguments);scheduleApply();return result};
    }
  }

  function boot(){
    if(typeof render!=='function'||!document.getElementById('bottomNav')){setTimeout(boot,80);return}
    installStyle();
    loadAllPlaces();
    patchCore();
    ensureButton();
    applyView();
    new MutationObserver(scheduleApply).observe(document.getElementById('appPanel'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','data-app-view']});
    window.addEventListener('online',scheduleApply);
    window.addEventListener('offline',scheduleApply);
    window.WorkshopReports=window.WorkshopReports||{};
    window.WorkshopReports.openList=openReports;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
