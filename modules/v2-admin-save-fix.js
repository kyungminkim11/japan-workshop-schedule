(function(){
  const V2=window.WorkshopV2;if(!V2||typeof saveState!=='function')return;
  async function saveSnapshot(){
    const payload={
      notes:state.notes||{},
      memoEntries:state.memoEntries||[],
      commentEntries:state.commentEntries||[],
      freePosts:state.freePosts||[],
      schedule:state.schedule||[],
      expenses:state.expenses||[],
      shoppingItems:state.shoppingItems||[],
      shopping:state.shopping||{},
      girlfriendRequests:state.girlfriendRequests||[],
      visitDone:state.visitDone||{},
      checkins:state.checkins||[],
      familyStatus:state.familyStatus||{}
    };
    const result=await V2.rawRpc('workshop_save_state',{p_token:token,p_data:payload});
    if(!result||!result.ok)throw new Error(result&&result.message||'저장 실패');
    return result;
  }
  const oldSaveState=saveState;
  saveState=async function(){
    if(V2.actualRole()==='admin')return saveSnapshot();
    return oldSaveState.apply(this,arguments);
  };
  V2.saveAdminSnapshot=saveSnapshot;
})();