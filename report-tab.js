(function workshopReportBottomTab(){
  if(window.__workshopReportBottomTab)return;
  window.__workshopReportBottomTab=true;

  let oldSyncAppView=null;
  let oldRender=null;
  let refreshTimer=0;

  function installStyle(){
    if(document.getElementById('reportTabStyle'))return;
    const style=document.createElement('style');
    style.id='reportTabStyle';
    style.textContent=`
      #bottomNav.has-report-tab{grid-template-columns:repeat(5,minmax(0,1fr))!important}
      #reportNavButton{position:relative}
      #reportNavButton .report-nav-badge{position:absolute;top:5px;left:calc(50% + 9px);display:grid;min-width:16px;height:16px;place-items:center;padding:0 4px;border:2px solid #fff;border-radius:999px;background:#e97967;color:#fff;font-size:9px;font-weight:900;line-height:1}
      #reportNavButton .report-nav-badge:empty{display:none}
      body[data-active-view="reports"] #quickPostFab,
      body[data-active-view="reports"] #quickPostFabFallback{display:none!important}
      body[data-active-view="reports"] #reportProjectPanel{margin-top:10px}
      @media(max-width:390px){
        #bottomNav.has-report-tab{gap:2px!important;padding-inline:5px!important}
        #bottomNav.has-report-tab button{font-size:10px!important;padding-inline:1px!important}
        #bottomNav.has-report-tab .nav-icon{font-size:19px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function reportPanel(){
    return document.getElementById('reportProjectPanel');
  }

  function reportButton(){
    return document.getElementById('reportNavButton');
  }

  function updateHeading(){
    if(activeView!=='reports')return;
    const heading=document.getElementById('uxViewHeading');
    if(!heading)return;
    const eyebrow=heading.querySelector('.ux-view-eyebrow');
    const title=heading.querySelector('h2');
    const text=heading.querySelector('p');
    if(eyebrow)eyebrow.textContent='REPORT';
    if(title)title.textContent='방문 매장 보고서';
    if(text)text.textContent='회사 워크샵으로 방문한 매장을 프로젝트별로 정리하세요.';
    heading.dataset.view='reports';
  }

  function updateBadge(){
    const button=reportButton();
    const panel=reportPanel();
    if(!button||!panel)return;
    const cards=Array.from(panel.querySelectorAll('.report-project-card'));
    const unfinished=cards.filter(card=>!card.classList.contains('status-done')).length;
    const badge=button.querySelector('.report-nav-badge');
    if(badge)badge.textContent=unfinished>0?String(Math.min(unfinished,99)):'';
    button.setAttribute('aria-label',unfinished?`보고서, 미완료 ${unfinished}개`:'보고서, 모두 작성 완료');
  }

  function ensureButton(){
    const nav=document.getElementById('bottomNav');
    if(!nav)return null;

    if(role!=='admin'){
      reportButton()?.remove();
      nav.classList.remove('has-report-tab');
      if(activeView==='reports'){
        activeView='home';
        storage.set('workshopView','home');
      }
      return null;
    }

    let button=reportButton();
    if(!button){
      button=document.createElement('button');
      button.id='reportNavButton';
      button.type='button';
      button.dataset.view='reports';
      button.innerHTML='<span class="nav-icon">▤</span><span>보고서</span><span class="report-nav-badge" aria-hidden="true"></span>';
      const settings=nav.querySelector('[data-view="settings"]');
      nav.insertBefore(button,settings||null);
      button.addEventListener('click',openReportsView);
    }
    nav.classList.add('has-report-tab');
    return button;
  }

  function applyReportView(){
    const panel=reportPanel();
    const button=ensureButton();
    if(panel)panel.dataset.appView='reports';

    if(role!=='admin'){
      if(panel)panel.hidden=true;
      return;
    }

    document.querySelectorAll('#bottomNav [data-view]').forEach(navButton=>{
      const selected=navButton.dataset.view===activeView;
      navButton.classList.toggle('active',selected);
      navButton.setAttribute('aria-current',selected?'page':'false');
    });

    if(activeView==='reports'){
      document.body.dataset.activeView='reports';
      document.querySelectorAll('[data-app-view]').forEach(element=>{
        const views=String(element.dataset.appView||'').split(/\s+/).filter(Boolean);
        element.hidden=!views.includes('reports');
      });
      if(panel)panel.hidden=false;
      updateHeading();
    }

    if(button)updateBadge();
  }

  function openReportsView(){
    if(role!=='admin')return;
    activeView='reports';
    storage.set('workshopView','reports');
    if(typeof window.WorkshopReports?.render==='function')window.WorkshopReports.render();
    if(typeof oldSyncAppView==='function')oldSyncAppView();
    applyReportView();
    requestAnimationFrame(()=>{
      applyReportView();
      window.scrollTo({top:0,left:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    });
  }

  function patchCore(){
    if(typeof syncAppView==='function'&&!oldSyncAppView){
      oldSyncAppView=syncAppView;
      syncAppView=function reportTabAwareSync(){
        const result=oldSyncAppView.apply(this,arguments);
        applyReportView();
        return result;
      };
    }
    if(typeof render==='function'&&!oldRender){
      oldRender=render;
      render=function reportTabAwareRender(){
        const result=oldRender.apply(this,arguments);
        scheduleRefresh();
        return result;
      };
    }
  }

  function scheduleRefresh(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>{
      ensureButton();
      applyReportView();
    },70);
  }

  function boot(){
    if(typeof render!=='function'||!document.getElementById('bottomNav')){
      setTimeout(boot,80);
      return;
    }
    installStyle();
    patchCore();
    ensureButton();
    applyReportView();

    const observer=new MutationObserver(scheduleRefresh);
    observer.observe(document.getElementById('appPanel'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','data-app-view']});
    window.addEventListener('online',scheduleRefresh);
    window.addEventListener('offline',scheduleRefresh);
    window.WorkshopReports=window.WorkshopReports||{};
    window.WorkshopReports.openList=openReportsView;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
