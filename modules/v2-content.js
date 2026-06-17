(function(){
  const V2=window.WorkshopV2;if(!V2)return;
  V2.socialApiReady=false;
  V2.useRpc((next,name,args)=>{
    if(V2.socialApiReady&&['workshop_add_post','workshop_add_comment'].includes(name))args={...(args||{}),p_device_id:V2.deviceId()};
    return next(name,args);
  });
  async function syncSocial(){
    if(!token)return;
    try{
      const result=await V2.rawRpc('workshop_get_social',{p_token:token,p_device_id:V2.deviceId()});
      if(!result||!result.ok)return;
      V2.socialApiReady=true;
      state.freePosts=Array.isArray(result.posts)?result.posts:state.freePosts||[];
      state.commentEntries=Array.isArray(result.comments)?result.comments:state.commentEntries||[];
      if(result.media&&Array.isArray(result.media))photos=result.media;
    }catch(error){if(!/schema cache|could not find|pgrst202/i.test(String(error&&error.message||error)))console.warn('social sync',error)}
  }
  V2.onLoad(syncSocial);
  function ownPost(post){return V2.actualRole()==='admin'||Boolean(post&&post.owned)||(V2.socialApiReady&&post&&post.deviceId===V2.deviceId())}
  async function refresh(){try{await loadState(true)}catch{if(typeof render==='function')render()}}
  V2.updatePost=async function(post){
    if(!post)return;const next=prompt('게시글 내용을 수정하세요.',post.text||'');if(next===null)return;
    try{
      if(V2.socialApiReady){const r=await rpc('workshop_update_post',{p_token:token,p_post_id:post.id,p_author:post.author||V2.getProfile(),p_text:safeText(next),p_device_id:V2.deviceId()});if(!r||!r.ok)throw new Error(r&&r.message||'수정 실패')}
      else if(V2.actualRole()==='admin'){const target=(state.freePosts||[]).find(p=>p.id===post.id);if(target){target.text=safeText(next);target.updatedAt=nowIso();await saveState()}}
      else throw new Error('게시글 관리 서버 업데이트 후 사용할 수 있습니다.');
      await refresh();if(typeof flash==='function')flash('게시글 수정 완료');
    }catch(e){alert(e.message)}
  };
  V2.deletePost=async function(post){
    if(!post||!confirm('이 게시글과 연결된 사진·댓글을 삭제할까요?'))return;
    try{
      if(V2.socialApiReady){const r=await rpc('workshop_delete_post',{p_token:token,p_post_id:post.id,p_device_id:V2.deviceId()});if(!r||!r.ok)throw new Error(r&&r.message||'삭제 실패')}
      else if(V2.actualRole()==='admin'){
        const itemId=V2.postMediaId(post);const media=(photos||[]).filter(p=>(p.itemId||p.item_id)===itemId);
        for(const file of media){try{await V2.rawRpc('workshop_delete_photo',{p_token:token,p_photo_id:file.id})}catch{}}
        state.freePosts=(state.freePosts||[]).filter(p=>p.id!==post.id);state.commentEntries=(state.commentEntries||[]).filter(c=>c.itemId!==itemId);photos=(photos||[]).filter(p=>(p.itemId||p.item_id)!==itemId);await saveState();
      }else throw new Error('게시글 관리 서버 업데이트 후 사용할 수 있습니다.');
      await refresh();if(typeof flash==='function')flash('게시글 삭제 완료');
    }catch(e){alert(e.message)}
  };
  V2.deleteComment=async function(comment){
    if(!comment||!confirm('이 댓글을 삭제할까요?'))return false;
    try{
      if(V2.socialApiReady){const r=await rpc('workshop_delete_comment',{p_token:token,p_comment_id:comment.id,p_device_id:V2.deviceId()});if(!r||!r.ok)throw new Error(r&&r.message||'댓글 삭제 실패')}
      else if(V2.actualRole()==='admin'){state.commentEntries=(state.commentEntries||[]).filter(c=>c.id!==comment.id);await saveState()}
      else throw new Error('댓글 관리 서버 업데이트 후 사용할 수 있습니다.');
      await refresh();return true;
    }catch(e){alert(e.message);return false}
  };
  function actionBar(card,post){
    if(!card||!post||card.querySelector('.v2-post-actions')||!ownPost(post))return;
    const bar=document.createElement('div');bar.className='v2-post-actions';
    const edit=document.createElement('button');edit.type='button';edit.className='ghost';edit.textContent='글 수정';edit.onclick=()=>V2.updatePost(post);
    const del=document.createElement('button');del.type='button';del.className='ghost danger';del.textContent='삭제';del.onclick=()=>V2.deletePost(post);
    bar.append(edit,del);card.appendChild(bar);
  }
  function enhanceList(){
    const list=document.getElementById('freePostList');if(!list)return;const posts=V2.visiblePosts().slice(0,12);Array.from(list.querySelectorAll('.free-post-card')).forEach((card,i)=>actionBar(card,posts[i]));
  }
  V2.onTimelineCard((card,item)=>{if(item&&item.freePost)actionBar(card,item.freePost)});
  V2.onRender(enhanceList);
  syncSocial().then(()=>{if(token&&typeof render==='function')render()});
})();