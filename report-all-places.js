(function workshopAllPlaceReports(){
  if(window.__workshopAllPlaceReports)return;
  window.__workshopAllPlaceReports=true;

  const DAYS=['0617','0618','0619','0620'];
  const DAY_LABEL={0617:'1일차 · 6/17',0618:'2일차 · 6/18',0619:'3일차 · 6/19',0620:'4일차 · 6/20'};
  const STATUS={todo:{label:'작성 전',icon:'○'},writing:{label:'작성 중',icon:'◐'},done:{label:'작성 완료',icon:'●'}};
  const FIELDS=['visitPurpose','storeOverview','products','display','service','purchases','learnings','strengths','improvements','finalSummary'];
  const TYPE_ICON={airport:'✈',transit:'🚆',hotel:'🏨',food:'🍽',shop:'🛍',meet:'📍'};
  const DRAFT_KEY='workshopReportDraftsV1';
  let rendering=false;
  let timer=0;
  let activeItemId='';
  let originalOpen=null;

  function readJson(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}}
  function safe(value){return String(value==null?'':value).trim()}
  function reportStore(){return state?.shopping?.reportProjects&&typeof state.shopping.reportProjects==='object'?state.shopping.reportProjects:{}}
  function reportFor(id){
    const remote=reportStore()[id]||{};
    const draft=readJson(DRAFT_KEY,{})[id]||{};
    const remoteTime=Date.parse(remote.updatedAt||0)||0;
    const draftTime=Date.parse(draft.updatedAt||0)||0;
    return draftTime>remoteTime?{...remote,...draft}:{...draft,...remote};
  }
  function statusOf(report){
    if(report?.status==='done')return'done';
    if(report?.status==='writing'||FIELDS.some(key=>safe(report?.[key])))return'writing';
    return'todo';
  }
  function completion(report){
    const filled=FIELDS.filter(key=>safe(report?.[key])).length;
    return{filled,total:FIELDS.length,percent:Math.round(filled/FIELDS.length*100)};
  }
  function allItems(){
    return(Array.isArray(state?.schedule)?state.schedule:[])
      .filter(item=>item&&item.id&&(safe(item.title)||safe(item.place)))
      .slice()
      .sort((a,b)=>{
        const dayDiff=DAYS.indexOf(a.day)-DAYS.indexOf(b.day);
        return dayDiff||state.schedule.indexOf(a)-state.schedule.indexOf(b);
      });
  }

  function ensureBaseScript(){
    if(window.WorkshopReports?.open||document.querySelector('script[src*="report-projects.js"]'))return;
    const script=document.createElement('script');
    script.src='report-projects.js?v=20260620-report-2';
    script.async=false;
    script.onload=()=>setTimeout(()=>{patchOpen();renderAllPlaces()},60);
    document.head.appendChild(script);
  }

  function ensurePanel(){
    let root=document.getElementById('reportProjectPanel');
    if(root)return root;
    const app=document.getElementById('appPanel');
    if(!app)return null;
    root=document.createElement('section');
    root.id='reportProjectPanel';
    root.className='panel admin-only report-project-panel';
    root.dataset.appView='reports';
    root.innerHTML='<div class="panel-title-row"><div><p class="eyebrow">WORKSHOP REPORT</p><h2>전체 워크샵 보고서</h2><p class="muted">타임라인과 일정표의 모든 장소를 날짜별로 열어 코멘트를 작성하세요.</p></div><span id="reportProjectSummary" class="report-summary-chip"></span></div><div id="reportProjectGroups" class="report-project-groups"></div>';
    app.appendChild(root);
    return root;
  }

  function ensureStyle(){
    if(document.getElementById('allPlaceReportStyle'))return;
    const style=document.createElement('style');
    style.id='allPlaceReportStyle';
    style.textContent=`
      body[data-active-view="reports"] #reportProjectPanel,body[data-active-view="reports"] #reportProjectPanel[hidden]{display:block!important;visibility:visible!important}
      .all-place-report-intro{display:grid;gap:5px;margin:4px 0 15px;padding:14px;border:1px solid #eadfd4;border-radius:18px;background:linear-gradient(135deg,#fffaf4,#fff)}
      .all-place-report-intro strong{font-size:15px;color:#51443a}.all-place-report-intro span{color:#7d6e63;font-size:12px;line-height:1.55}
      .report-place-type{display:inline-grid;width:28px;height:28px;place-items:center;border-radius:10px;background:#f8eee6;font-size:14px}
      .report-project-card .report-place-title{display:flex;align-items:center;gap:8px}.report-project-card .report-place-title strong{min-width:0;font-size:16px;line-height:1.35}
      .report-project-card .report-comment-hint{margin-top:auto;color:#aa684d;font-size:11px;font-weight:900}
      .report-field.primary-comment-field{grid-column:1/-1;border-color:#efc8b6;background:linear-gradient(145deg,#fffdfb,#fff5ef);box-shadow:0 9px 22px rgba(166,101,73,.08)}
      .report-field.primary-comment-field>span{font-size:16px;color:#9e5f45}.report-field.primary-comment-field textarea{min-height:190px;border-color:#ead2c5;background:#fff!important}
      .report-optional-label{grid-column:1/-1;margin:4px 2px -2px;color:#85766b;font-size:11px;font-weight:800;letter-spacing:.04em}
    `;
    document.head.appendChild(style);
  }

  function renderAllPlaces(){
    const root=ensurePanel();
    if(!root||role!=='admin'||rendering)return;
    rendering=true;
    try{
      root.dataset.appView='reports';
      if(activeView==='reports')root.hidden=false;
      const items=allItems();
      const signature=items.map(item=>{const report=reportFor(item.id);return`${item.id}:${statusOf(report)}:${report.updatedAt||''}`}).join('|');
      if(root.dataset.allPlacesSignature===signature&&root.dataset.allPlacesReady==='1'){enhanceDialog();return}
      root.dataset.allPlacesSignature=signature;
      root.dataset.allPlacesReady='1';

      const title=root.querySelector('h2');
      const description=root.querySelector('.panel-title-row .muted');
      const eyebrow=root.querySelector('.eyebrow');
      if(eyebrow)eyebrow.textContent='WORKSHOP REPORT';
      if(title)title.textContent='전체 워크샵 보고서';
      if(description)description.textContent='타임라인과 일정표의 모든 장소를 날짜별로 열어 코멘트를 작성하세요.';

      const summary=root.querySelector('#reportProjectSummary');
      const done=items.filter(item=>statusOf(reportFor(item.id))==='done').length;
      if(summary)summary.textContent=`${done}/${items.length} 완료`;

      const groups=root.querySelector('#reportProjectGroups');
      if(!groups)return;
      groups.replaceChildren();
      const intro=document.createElement('div');
      intro.className='all-place-report-intro';
      intro.innerHTML=`<strong>하나의 보고서 · 장소별 코멘트</strong><span>공항, 이동, 호텔, 식당, 카페, 문구점, 쇼핑 장소까지 일정에 기록된 ${items.length}개 항목이 모두 표시됩니다.</span>`;
      groups.appendChild(intro);

      DAYS.forEach(day=>{
        const dayItems=items.filter(item=>item.day===day);
        if(!dayItems.length)return;
        const section=document.createElement('section');
        section.className='report-day-group';
        const heading=document.createElement('div');
        heading.className='report-day-heading';
        heading.innerHTML=`<strong>${DAY_LABEL[day]||day}</strong><span>${dayItems.length}개 장소</span>`;
        const grid=document.createElement('div');
        grid.className='report-card-grid';
        dayItems.forEach(item=>{
          const report=reportFor(item.id);
          const status=statusOf(report);
          const progress=completion(report);
          const card=document.createElement('button');
          card.type='button';
          card.className=`report-project-card status-${status}`;
          card.dataset.reportItemId=item.id;
          card.innerHTML=`<span class="report-card-top"><span>${safe(item.time)||'시간 미정'}</span><span class="report-status">${STATUS[status].icon} ${STATUS[status].label}</span></span><span class="report-place-title"><span class="report-place-type">${TYPE_ICON[item.type]||'📌'}</span><strong>${safe(item.title)||safe(item.place)}</strong></span><small>${safe(item.place)||'장소 정보 없음'}</small><span class="report-progress"><i style="width:${progress.percent}%"></i></span><span class="report-progress-label">${progress.filled}/${progress.total} 항목 작성</span><span class="report-comment-hint">장소 코멘트 작성 ›</span>`;
          card.addEventListener('click',()=>openPlace(item.id));
          grid.appendChild(card);
        });
        section.append(heading,grid);
        groups.appendChild(section);
      });
    }finally{rendering=false}
    enhanceDialog();
    window.dispatchEvent(new Event('workshop-report-list-updated'));
  }

  function openPlace(id){
    activeItemId=id;
    ensureBaseScript();
    if(typeof window.WorkshopReports?.open==='function')window.WorkshopReports.open(id);
    else setTimeout(()=>openPlace(id),180);
    setTimeout(enhanceDialog,50);
  }

  function patchOpen(){
    if(!window.WorkshopReports?.open||originalOpen)return;
    originalOpen=window.WorkshopReports.open;
    window.WorkshopReports.open=function(id){activeItemId=id;const result=originalOpen.apply(this,arguments);setTimeout(enhanceDialog,40);return result};
  }

  function enhanceDialog(){
    const dialog=document.getElementById('reportProjectDialog');
    if(!dialog)return;
    const field=dialog.querySelector('[data-report-field="visitPurpose"]')?.closest('.report-field');
    if(field){
      field.classList.add('primary-comment-field');
      const label=field.querySelector('span');
      const textarea=field.querySelector('textarea');
      if(label)label.textContent='장소별 코멘트';
      if(textarea)textarea.placeholder='이 장소에서 한 일, 느낀 점, 특이사항, 보고서에 넣을 내용을 자유롭게 적어주세요.';
    }
    const fields=dialog.querySelector('#reportFields');
    if(fields&&!fields.querySelector('.report-optional-label')){
      const label=document.createElement('p');
      label.className='report-optional-label';
      label.textContent='아래 항목은 필요한 장소에서만 추가로 작성하세요.';
      fields.querySelector('.report-field')?.insertAdjacentElement('afterend',label);
    }
  }

  function scheduleRender(){clearTimeout(timer);timer=setTimeout(()=>{patchOpen();renderAllPlaces()},80)}

  function boot(){
    if(typeof state!=='object'||!document.getElementById('appPanel')){setTimeout(boot,80);return}
    ensureStyle();
    ensureBaseScript();
    ensurePanel();
    patchOpen();
    renderAllPlaces();
    new MutationObserver(scheduleRender).observe(document.getElementById('appPanel'),{childList:true,subtree:true});
    window.WorkshopReports=window.WorkshopReports||{};
    window.WorkshopReports.renderAllPlaces=renderAllPlaces;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
