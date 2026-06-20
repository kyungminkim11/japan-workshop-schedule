(function(){
  if(window.__statePreservationPatch)return;
  function install(){
    if(typeof rpc!=="function"||typeof state!=="object"||typeof saveState!=="function")return false;
    saveState=async function(){
      if(role!=="admin")return;
      const payload={
        notes:state.notes||{},
        memoEntries:Array.isArray(state.memoEntries)?state.memoEntries:[],
        commentEntries:Array.isArray(state.commentEntries)?state.commentEntries:[],
        freePosts:Array.isArray(state.freePosts)?state.freePosts:[],
        schedule:Array.isArray(state.schedule)?state.schedule:[],
        expenses:Array.isArray(state.expenses)?state.expenses:[],
        shoppingItems:Array.isArray(state.shoppingItems)?state.shoppingItems:[],
        shopping:state.shopping&&typeof state.shopping==="object"&&!Array.isArray(state.shopping)?state.shopping:{},
        girlfriendRequests:Array.isArray(state.girlfriendRequests)?state.girlfriendRequests:[],
        visitDone:state.visitDone&&typeof state.visitDone==="object"?state.visitDone:{},
        checkins:Array.isArray(state.checkins)?state.checkins:[],
        familyStatus:state.familyStatus&&typeof state.familyStatus==="object"?state.familyStatus:{}
      };
      const result=await rpc("workshop_save_state",{p_token:token,p_data:payload});
      if(!result||!result.ok)throw new Error(result&&result.message?result.message:"저장 실패");
      return result;
    };
    window.WorkshopV2=window.WorkshopV2||{};
    window.WorkshopV2.saveAdminSnapshot=saveState;
    window.__statePreservationPatch=true;
    return true;
  }
  if(!install()){
    const timer=setInterval(()=>{if(install())clearInterval(timer)},80);
    setTimeout(()=>clearInterval(timer),10000);
  }
})();
