(function(){
  const V2=window.WorkshopV2;if(!V2)return;
  const OPTIONS={family:['엄마','아빠','이모','이모부'],girlfriend:['서영'],admin:['경민']};
  function suggested(){return OPTIONS[role]||[]}
  function fillAuthors(){
    const name=V2.getProfile();if(!name)return;
    document.querySelectorAll('[data-post-author],[data-comment-author],.timeline-thread-form input:first-child').forEach(input=>{if(!safeText(input.value))input.value=name});
  }
  function closeModal(){const modal=document.getElementById('v2ProfileModal');if(modal)modal.hidden=true}
  function saveName(value){const name=safeText(value).slice(0,40);if(!name)return false;V2.setProfile(name);fillAuthors();closeModal();if(typeof flash==='function')flash(`${name}님으로 저장됨`);return true}
  function modal(){
    let box=document.getElementById('v2ProfileModal');if(box)return box;
    box=document.createElement('div');box.id='v2ProfileModal';box.className='v2-modal';box.hidden=true;
    box.innerHTML='<section class="v2-modal-card"><h2>이 기기를 사용하는 분</h2><p>가족 계정을 여러 명이 함께 사용하므로 이 휴대폰의 작성자 이름을 한 번만 설정해주세요.</p><div class="v2-profile-options"></div><div class="v2-profile-custom"><input maxlength="40" placeholder="이름 직접 입력"><button type="button">저장</button></div></section>';
    document.body.appendChild(box);
    box.querySelector('.v2-profile-custom button').onclick=()=>saveName(box.querySelector('input').value);
    box.querySelector('input').addEventListener('keydown',e=>{if(e.key==='Enter')saveName(e.currentTarget.value)});
    return box;
  }
  function showSetup(force=false){
    if(!token||(!force&&V2.getProfile())||role==='admin')return;
    const box=modal(),options=box.querySelector('.v2-profile-options');options.replaceChildren();
    suggested().forEach(name=>{const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=name;b.onclick=()=>saveName(name);options.appendChild(b)});
    box.hidden=false;
  }
  function settingsCard(){
    const panel=document.getElementById('settingsPanel');if(!panel||!token)return;
    let card=document.getElementById('v2ProfileCard');
    if(!card){
      card=document.createElement('div');card.id='v2ProfileCard';card.className='v2-profile-card';
      card.innerHTML='<h3>작성자 이름</h3><p class="muted">이 기기에서 댓글과 소식을 올릴 때 자동으로 입력됩니다.</p><div class="v2-profile-row"><label>이름<input maxlength="40"></label><button type="button">이름 저장</button></div>';
      panel.appendChild(card);card.querySelector('button').onclick=()=>saveName(card.querySelector('input').value);
    }
    card.querySelector('input').value=V2.getProfile()||(role==='admin'?'경민':'');
  }
  V2.onRender(()=>{fillAuthors();settingsCard();showSetup(false)});
  document.addEventListener('workshop:v2-ready',()=>showSetup(false));
})();