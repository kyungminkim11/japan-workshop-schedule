(function boot(){
  if(window.__workshopNewContentAlert)return;
  if(typeof render!=='function'||typeof collectTimelineItems!=='function'||typeof loadState!=='function')return setTimeout(boot,80);
  const KEY='wkAlertSeen:',SNOOZE='wkAlertSnooze:',NOTIFIED='wkBrowserNotified:';
  const actualAdmin=()=>role==='admin'||storage.get('wkReal')==='admin'||Boolean(window.WorkshopV2&&WorkshopV2.actualRole&&WorkshopV2.actualRole()==='admin');
  function device(){if(window.WorkshopV2&&WorkshopV2.deviceId)return WorkshopV2.deviceId();let id=storage.get('wkAlertDevice');if(!id){id=`d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;storage.set('wkAlertDevice',id)}return id}
  function key(prefix){return`${prefix}${role||'guest'}:${device()}`}
  function time(value){const n=new Date(value||0).getTime();return Number.isFinite(n)?n:0}
  function items(){try{return collectTimelineItems().filter(item=>time(item.at)>0&&!item.private).sort((a,b)=>time(b.at)-time(a.at))}catch{return[]}}
  function latest(){return items()[0]||null}
  function summary(item){const text=String(item&&((item.text)||(item.title)||(item.type))||'새 소식').replace(/\[\[WORKSHOP_LOC:[^\]]+\]\]/g,'').trim();return text.length>90?`${text.slice(0,90)}…`:text}
  function mark(value){storage.set(key(KEY),String(value||Date.now()));const modal=document.getElementById('newContentPopup');if(modal)modal.hidden=true;document.body.style.overflow=''}
  function registerWorker(){if(!('serviceWorker'in navigator))return Promise.resolve(null);return navigator.serviceWorker.register('./sw.js?v=20260617-alert-1').then(()=>navigator.serviceWorker.ready).catch(()=>null)}
  async function systemNotify(item,stamp){
    if(!('Notification'in window)||Notification.permission!=='granted'||Number(storage.get(key(NOTIFIED))||0)>=stamp)return;
    storage.set(key(NOTIFIED),String(stamp));
    const options={body:summary(item),tag:`workshop-${stamp}`,renotify:false,data:{url:`${location.pathname}#timeline`}};
    try{const reg=await registerWorker();if(reg)await reg.showNotification('워크샵 새 소식',options);else new Notification('워크샵 새 소식',options)}catch{}
  }
  function popup(item,stamp){
    let box=document.getElementById('newContentPopup');
    if(!box){box=document.createElement('div');box.id='newContentPopup';box.className='new-content-popup';box.hidden=true;box.innerHTML='<section><span class="new-content-mark">NEW</span><h2>새 소식이 도착했어요</h2><p data-popup-summary></p><div><button type="button" data-open>지금 보기</button><button type="button" class="ghost" data-later>나중에</button><button type="button" class="ghost" data-confirm>확인</button></div></section>';document.body.appendChild(box)}
    box.dataset.stamp=String(stamp);box.querySelector('[data-popup-summary]').textContent=summary(item);box.querySelector('[data-open]').onclick=()=>{mark(stamp);if(typeof setActiveView==='function')setActiveView('timeline')};box.querySelector('[data-confirm]').onclick=()=>mark(stamp);box.querySelector('[data-later]').onclick=()=>{storage.set(key(SNOOZE),String(Date.now()+300000));box.hidden=true;document.body.style.overflow=''};box.hidden=false;document.body.style.overflow='hidden';
  }
  function inspect(){
    if(!token||actualAdmin())return;const item=latest();if(!item)return;const stamp=time(item.at),seen=Number(storage.get(key(KEY))||0),snooze=Number(storage.get(key(SNOOZE))||0);
    if(!seen){storage.set(key(KEY),String(stamp));return}if(stamp<=seen)return;systemNotify(item,stamp);if(Date.now()>=snooze){const box=document.getElementById('newContentPopup');if(!box||box.hidden||Number(box.dataset.stamp)!==stamp)popup(item,stamp)}
  }
  async function refresh(){if(!token||actualAdmin()||busy||!navigator.onLine)return;try{await loadState(true)}catch{}}
  function notificationCard(){
    const panel=document.getElementById('settingsPanel');if(!panel||document.getElementById('notificationSettingCard'))return;const card=document.createElement('div');card.id='notificationSettingCard';card.className='notification-setting-card';const supported='Notification'in window;card.innerHTML=`<div><strong>새 소식 알림</strong><p>${supported?'앱이 열려 있거나 백그라운드에 있을 때 브라우저 알림을 받을 수 있습니다.':'이 브라우저에서는 앱 안 팝업과 배너로 알려드립니다.'}</p></div>${supported?'<button type="button" class="ghost">알림 켜기</button>':''}`;panel.appendChild(card);if(supported){const button=card.querySelector('button');const sync=()=>{button.textContent=Notification.permission==='granted'?'브라우저 알림 켜짐':Notification.permission==='denied'?'브라우저에서 차단됨':'알림 켜기';button.disabled=Notification.permission==='denied'};button.onclick=async()=>{try{const result=await Notification.requestPermission();if(result==='granted'){await registerWorker();button.textContent='브라우저 알림 켜짐'}else sync()}catch{sync()}};sync()}
  }
  const style=document.createElement('style');style.textContent='.new-content-popup{position:fixed;inset:0;z-index:10100;display:grid;place-items:center;padding:20px;background:rgba(48,40,35,.58);backdrop-filter:blur(8px)}.new-content-popup[hidden]{display:none}.new-content-popup section{width:min(430px,100%);padding:24px;border:1px solid var(--line);border-radius:28px;background:var(--paper);box-shadow:0 24px 70px rgba(40,30,25,.25);text-align:center}.new-content-popup h2{margin:8px 0}.new-content-popup p{line-height:1.65;color:var(--muted);white-space:pre-wrap}.new-content-popup section>div{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.new-content-mark{display:inline-flex;padding:5px 10px;border-radius:999px;background:#fff0f2;color:#ec7481;font-size:12px;font-weight:900}.notification-setting-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;margin-top:13px;padding:13px;border:1px solid var(--line);border-radius:18px;background:#fffaf7}.notification-setting-card p{margin:4px 0 0;color:var(--muted);font-size:12px;line-height:1.5}@media(max-width:500px){.notification-setting-card{grid-template-columns:1fr}.notification-setting-card button{width:100%}}';document.head.appendChild(style);
  const oldRender=render;render=function(){const out=oldRender.apply(this,arguments);setTimeout(()=>{notificationCard();inspect()},0);return out};window.__workshopNewContentAlert=true;setInterval(refresh,45000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});notificationCard();inspect();registerWorker();
})();