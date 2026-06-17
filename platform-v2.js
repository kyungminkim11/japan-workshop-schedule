(function(){
  if(window.WorkshopV2)return;
  const V2={version:'2.0.0',renderHooks:[],timelineHooks:[],rpcMiddleware:[],loadHooks:[]};
  V2.actualRole=()=>storage.get('wkReal')==='admin'?'admin':role;
  V2.deviceId=()=>{let id=storage.get('wkDeviceV2');if(!id){id=`dv2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;storage.set('wkDeviceV2',id)}return id};
  V2.profileKey=()=>`workshopProfileV2:${role||'guest'}:${V2.deviceId()}`;
  V2.getProfile=()=>storage.get(V2.profileKey())||'';
  V2.setProfile=name=>storage.set(V2.profileKey(),safeText(name).slice(0,40));
  V2.onRender=fn=>{if(typeof fn==='function')V2.renderHooks.push(fn)};
  V2.onTimelineCard=fn=>{if(typeof fn==='function')V2.timelineHooks.push(fn)};
  V2.onLoad=fn=>{if(typeof fn==='function')V2.loadHooks.push(fn)};
  V2.useRpc=fn=>{if(typeof fn==='function')V2.rpcMiddleware.push(fn)};
  V2.emit=(name,detail={})=>document.dispatchEvent(new CustomEvent(name,{detail}));
  V2.escape=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  V2.postMediaId=post=>`fp:${String(post&&post.id||'').slice(0,29)}`.slice(0,32);
  V2.visiblePosts=()=>((state&&state.freePosts)||[]).filter(p=>role==='admin'||p.audienceRole===role).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  V2.visibleComments=()=>((state&&state.commentEntries)||[]).filter(c=>role==='admin'||c.audienceRole===role);

  function installCss(){
    if(document.querySelector('link[href*="platform-v2.css"]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='platform-v2.css?v=20260617-v2-1';document.head.appendChild(link);
  }
  function installHooks(){
    if(typeof render==='function'&&!render.__v2){
      const base=render;
      render=function(){const result=base.apply(this,arguments);queueMicrotask(()=>V2.renderHooks.forEach(fn=>{try{fn()}catch(e){console.error('V2 render hook',e)}}));return result};
      render.__v2=true;
    }
    if(typeof renderTimelineCard==='function'&&!renderTimelineCard.__v2){
      const base=renderTimelineCard;
      renderTimelineCard=function(box,item,compact=false){const before=box.children.length;const result=base.apply(this,arguments);const card=box.children[before]||box.lastElementChild;V2.timelineHooks.forEach(fn=>{try{fn(card,item,compact,box)}catch(e){console.error('V2 timeline hook',e)}});return result};
      renderTimelineCard.__v2=true;
    }
    if(typeof rpc==='function'&&!rpc.__v2){
      const raw=rpc;
      V2.rawRpc=raw;
      rpc=function(name,args={}){
        let index=-1;
        const dispatch=(i,n,a)=>{if(i<=index)return Promise.reject(new Error('RPC middleware order error'));index=i;const mw=V2.rpcMiddleware[i];return mw?Promise.resolve(mw((nn=n,aa=a)=>dispatch(i+1,nn,aa),n,a)):raw(n,a)};
        return dispatch(0,name,args||{});
      };
      rpc.__v2=true;
    }
    if(typeof loadState==='function'&&!loadState.__v2){
      const base=loadState;
      loadState=async function(){const result=await base.apply(this,arguments);for(const fn of V2.loadHooks){try{await fn()}catch(e){console.warn('V2 load hook',e)}}return result};
      loadState.__v2=true;
    }
  }
  function loadScript(src){return new Promise((resolve,reject)=>{if(document.querySelector(`script[src*="${src.split('?')[0]}"]`))return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
  async function boot(){
    if(typeof render!=='function'||typeof rpc!=='function')return setTimeout(boot,80);
    installCss();installHooks();window.WorkshopV2=V2;
    const modules=['modules/v2-profile.js','modules/v2-media.js','modules/v2-content.js','modules/v2-album-admin.js'];
    for(const src of modules){try{await loadScript(`${src}?v=20260617-v2-1`)}catch(e){console.error('V2 module load failed',src,e)}}
    installHooks();V2.emit('workshop:v2-ready',{version:V2.version});
    if(token)render();
  }
  boot();
})();