(function boot(){
  if(window.__timelineDayFilter)return;
  if(typeof renderTimeline!=='function'||typeof renderTimelineCard!=='function'||typeof collectTimelineItems!=='function'||!window.__workshopPostGroupPatch)return setTimeout(boot,80);
  const days=[['0617','1일차','6/17'],['0618','2일차','6/18'],['0619','3일차','6/19'],['0620','4일차','6/20']];
  let selected=storage.get('workshopTimelineDay')||'0617';
  function toDay(value){const d=new Date(value||0);return Number.isFinite(d.getTime())?`${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`:''}
  function dayOf(item){if(!item)return'';if(days.some(d=>d[0]===item.day))return item.day;if(days.some(d=>d[0]===item.scheduleDay))return item.scheduleDay;if(item.freePost)return toDay(item.freePost.createdAt||item.at);if(item.memoEntry)return item.memoEntry.scheduleDay||toDay(item.memoEntry.createdAt||item.at);return toDay(item.at||item.createdAt)}
  function toolbar(){
    const panel=document.getElementById('timelinePanel'),list=document.getElementById('timelineList');if(!panel||!list)return;
    let bar=document.getElementById('timelineDayButtons');
    if(!bar){bar=document.createElement('div');bar.id='timelineDayButtons';bar.className='timeline-day-buttons';days.forEach(([id,label,date])=>{const b=document.createElement('button');b.type='button';b.dataset.day=id;b.innerHTML=`<strong>${label}</strong><small>${date}</small>`;b.onclick=()=>{selected=id;storage.set('workshopTimelineDay',id);renderTimeline()};bar.appendChild(b)});panel.insertBefore(bar,list)}
    bar.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.day===selected));
  }
  const style=document.createElement('style');style.textContent='.timeline-day-buttons{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:2px 0 15px}.timeline-day-buttons button{display:grid;gap:2px;min-height:58px;padding:9px 5px;border-radius:18px}.timeline-day-buttons small{font-size:11px;color:var(--muted)}.timeline-day-buttons button.active{background:linear-gradient(180deg,#ffa4ad,#ff8996)!important;color:#fff!important;border-color:#ff8996!important}.timeline-day-buttons button.active small{color:#fff7f8}@media(max-width:540px){.timeline-day-buttons{grid-template-columns:repeat(2,minmax(0,1fr))}}';document.head.appendChild(style);
  renderTimeline=function(){toolbar();const box=document.getElementById('timelineList');if(!box)return;box.replaceChildren();const items=collectTimelineItems().filter(item=>dayOf(item)===selected);if(!items.length){const meta=days.find(d=>d[0]===selected),e=document.createElement('div');e.className='empty-state';e.innerHTML=`<strong>${meta?meta[1]:selected} 기록이 없습니다.</strong><p>해당 일차의 글, 사진, 체크인, 메모가 여기에 표시됩니다.</p>`;box.appendChild(e);return}items.slice(0,80).forEach(item=>renderTimelineCard(box,item));toolbar()};
  window.__timelineDayFilter=true;if(token&&typeof render==='function')render();
})();