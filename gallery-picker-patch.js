(function(){
  function stripCameraMode(){
    var inputs=document.querySelectorAll('#photoInput,[data-memo-files],[data-post-files],input[type="file"][accept*="image"]');
    inputs.forEach(function(input){
      input.removeAttribute('capture');
      input.setAttribute('accept','image/*,video/mp4,video/webm,video/quicktime');
      var label=input.closest('label')||input.parentElement;
      if(!label)return;
      var old=label.querySelector('.camera-save-hint');
      if(old)old.remove();
      if(!label.querySelector('.gallery-select-hint')){
        var hint=document.createElement('small');
        hint.className='gallery-select-hint';
        hint.textContent='갤러리에서 사진/영상을 선택해서 올릴 수 있습니다. 직접 찍은 사진은 카메라 앱으로 촬영한 뒤 갤러리에서 선택하세요.';
        label.appendChild(hint);
      }
    });
  }
  function style(){
    if(document.getElementById('galleryPickerPatchStyle'))return;
    var s=document.createElement('style');
    s.id='galleryPickerPatchStyle';
    s.textContent='.gallery-select-hint{display:block;margin-top:6px;color:var(--muted);font-size:12px;line-height:1.5}';
    document.head.appendChild(s);
  }
  function install(){
    if(window.__workshopGalleryPickerPatch)return true;
    if(typeof render!=='function')return false;
    style();
    var oldRender=render;
    render=function(){var out=oldRender.apply(this,arguments);setTimeout(stripCameraMode,0);return out};
    window.__workshopGalleryPickerPatch=true;
    stripCameraMode();
    return true;
  }
  if(!install()){
    var t=setInterval(function(){if(install())clearInterval(t)},80);
    setTimeout(function(){clearInterval(t)},10000);
  }
})();