import * as THREE from 'https://esm.sh/three@0.170.0';
import { OrbitControls } from 'https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';

const parts=[
  {id:'cap_top',nameKo:'캡탑',nameEn:'Cap Top'},
  {id:'cap_body',nameKo:'캡',nameEn:'Cap Body'},
  {id:'grip_section',nameKo:'그립 섹션',nameEn:'Grip Section'},
  {id:'center_ring_or_connector',nameKo:'중앙 연결 파츠',nameEn:'Center Connector'},
  {id:'barrel_body',nameKo:'배럴',nameEn:'Barrel Body'},
  {id:'barrel_end',nameKo:'배럴엔드',nameEn:'Barrel End'}
];

const colors=[
  {id:'black',code:'BK',nameKo:'블랙',hex:'#17191d',group:'basic'},
  {id:'white',code:'WH',nameKo:'화이트',hex:'#f3f1ea',group:'basic'},
  {id:'navy',code:'NV',nameKo:'네이비',hex:'#18365d',group:'basic'},
  {id:'blue',code:'BL',nameKo:'블루',hex:'#3279bd',group:'basic'},
  {id:'sky',code:'SK',nameKo:'스카이',hex:'#8fc8df',group:'basic'},
  {id:'pink',code:'PK',nameKo:'핑크',hex:'#dfa2b5',group:'basic'},
  {id:'red',code:'RD',nameKo:'레드',hex:'#b84045',group:'basic'},
  {id:'yellow',code:'YL',nameKo:'옐로',hex:'#e7c84d',group:'basic'},
  {id:'green',code:'GN',nameKo:'그린',hex:'#4f8a70',group:'basic'},
  {id:'clear',code:'CL',nameKo:'클리어',hex:'#dcebed',group:'basic',transparent:true,opacity:.34},
  {id:'charcoal',code:'CH',nameKo:'차콜',hex:'#4d5259',group:'new',isNew:true},
  {id:'beige',code:'BG',nameKo:'베이지',hex:'#d3bfa0',group:'new',isNew:true},
  {id:'mint',code:'MT',nameKo:'민트',hex:'#9acbbb',group:'new',isNew:true},
  {id:'lavender',code:'LV',nameKo:'라벤더',hex:'#aaa2cf',group:'new',isNew:true},
  {id:'coral',code:'CO',nameKo:'코랄',hex:'#dc8b7d',group:'new',isNew:true},
  {id:'orange',code:'OR',nameKo:'오렌지',hex:'#d88138',group:'new',isNew:true},
  {id:'purple',code:'PU',nameKo:'퍼플',hex:'#75558b',group:'new',isNew:true},
  {id:'teal',code:'TL',nameKo:'틸',hex:'#367d80',group:'new',isNew:true},
  {id:'smoke',code:'SM',nameKo:'스모크 클리어',hex:'#7c858b',group:'special',isNew:true,transparent:true,opacity:.42},
  {id:'amber',code:'AM',nameKo:'앰버 클리어',hex:'#c38c45',group:'special',isNew:true,transparent:true,opacity:.45}
];

const defaults={cap_top:'white',cap_body:'navy',grip_section:'pink',center_ring_or_connector:'clear',barrel_body:'clear',barrel_end:'navy'};
const presets=[
  {id:'signature',name:'블루블랙 시그니처',values:{cap_top:'navy',cap_body:'navy',grip_section:'white',center_ring_or_connector:'clear',barrel_body:'blue',barrel_end:'navy'}},
  {id:'mono',name:'클래식 모노톤',values:{cap_top:'black',cap_body:'charcoal',grip_section:'white',center_ring_or_connector:'black',barrel_body:'charcoal',barrel_end:'black'}},
  {id:'clear',name:'투명 포인트',values:{cap_top:'sky',cap_body:'clear',grip_section:'navy',center_ring_or_connector:'clear',barrel_body:'clear',barrel_end:'sky'}},
  {id:'pastel',name:'부드러운 파스텔',values:{cap_top:'lavender',cap_body:'pink',grip_section:'mint',center_ring_or_connector:'clear',barrel_body:'sky',barrel_end:'beige'}}
];

const el=id=>document.getElementById(id);
const ui={
  host:el('canvasHost'),stage:el('viewerStage'),loading:el('viewerLoading'),error:el('viewerError'),status:el('modelStatus'),
  partTabs:el('partTabs'),colorGroups:el('colorGroups'),colorHeading:el('colorHeading'),selectedColorLabel:el('selectedColorLabel'),
  progressText:el('progressText'),progressBar:el('progressBar'),summaryGrid:el('summaryGrid'),combinationCode:el('combinationCode'),
  presetGrid:el('presetGrid'),toast:el('toast'),staffView:el('staffView'),staffPreviewImage:el('staffPreviewImage'),staffCode:el('staffCode'),staffList:el('staffList')
};

let activePartIndex=0;
let selection={...defaults};
let renderer,camera,controls,scene,rootModel;
let partMeshes=new Map();
let usingFallback=true;
let toastTimer;

const colorById=id=>colors.find(color=>color.id===id)||colors[0];
const isValidColor=id=>colors.some(color=>color.id===id);
const prefersReducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

function loadInitialSelection(){
  const params=new URLSearchParams(location.search);
  let hasValidUrlValue=false;
  parts.forEach(part=>{const value=params.get(part.id);if(value&&isValidColor(value)){selection[part.id]=value;hasValidUrlValue=true;}});
  if(hasValidUrlValue)return;
  try{const saved=JSON.parse(localStorage.getItem('bb-pen-combination')||'null');if(saved)parts.forEach(part=>{if(isValidColor(saved[part.id]))selection[part.id]=saved[part.id];});}catch{}
}

function persistSelection(){
  try{localStorage.setItem('bb-pen-combination',JSON.stringify(selection));}catch{}
  const url=new URL(location.href);
  parts.forEach(part=>url.searchParams.set(part.id,selection[part.id]));
  history.replaceState(null,'',url);
}

function combinationCode(){return `BB-SAILOR-${parts.map(part=>colorById(selection[part.id]).code).join('-')}`;}

function createPlasticMaterial(colorId){
  const color=colorById(colorId);
  return new THREE.MeshPhysicalMaterial({
    color:color.hex,roughness:color.transparent?.16:.24,metalness:0,clearcoat:.8,clearcoatRoughness:.16,
    transparent:Boolean(color.transparent),opacity:color.opacity||1,depthWrite:!color.transparent,side:THREE.DoubleSide
  });
}

function disposeMaterial(material){
  const list=Array.isArray(material)?material:[material];
  list.forEach(item=>item?.dispose?.());
}

function applyPartMaterials(){
  parts.forEach(part=>{
    const meshes=partMeshes.get(part.id)||[];
    meshes.forEach(mesh=>{disposeMaterial(mesh.material);mesh.material=createPlasticMaterial(selection[part.id]);mesh.material.needsUpdate=true;});
  });
}

function makeTemporaryPen(){
  partMeshes.clear();
  const group=new THREE.Group();
  group.rotation.z=-.08;
  const metal=new THREE.MeshStandardMaterial({color:0xd7dce2,metalness:.92,roughness:.18});
  const register=(id,mesh)=>{partMeshes.set(id,[mesh]);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);};
  const cylinder=(r1,r2,length,id,x)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,length,48),createPlasticMaterial(selection[id]));mesh.rotation.z=Math.PI/2;mesh.position.x=x;register(id,mesh);};
  cylinder(.58,.63,.45,'cap_top',-3.72);
  cylinder(.72,.64,1.78,'cap_body',-2.63);
  cylinder(.52,.62,.82,'grip_section',-1.22);
  cylinder(.65,.65,.18,'center_ring_or_connector',-.70);
  cylinder(.66,.53,3.42,'barrel_body',1.10);
  cylinder(.53,.32,.55,'barrel_end',3.05);
  const clip=new THREE.Mesh(new THREE.BoxGeometry(1.42,.075,.12),metal);clip.position.set(-2.56,.69,.05);clip.castShadow=true;group.add(clip);
  const clipBall=new THREE.Mesh(new THREE.SphereGeometry(.12,24,16),metal);clipBall.position.set(-1.87,.67,.05);group.add(clipBall);
  [-1.68,-.69].forEach(x=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(.655,.052,12,42),metal);ring.rotation.y=Math.PI/2;ring.position.x=x;group.add(ring);});
  const nib=new THREE.Mesh(new THREE.ConeGeometry(.38,1.15,40),metal);nib.rotation.z=-Math.PI/2;nib.position.x=3.85;nib.castShadow=true;group.add(nib);
  const nibTip=new THREE.Mesh(new THREE.CylinderGeometry(.025,.045,.42,18),metal);nibTip.rotation.z=Math.PI/2;nibTip.position.x=4.60;group.add(nibTip);
  return group;
}

function mapGLBParts(model){
  const mapped=new Map();
  parts.forEach(part=>mapped.set(part.id,[]));
  model.traverse(object=>{
    if(!object.isMesh)return;
    object.castShadow=true;object.receiveShadow=true;
    const part=parts.find(item=>item.id===object.name||item.id===object.parent?.name);
    if(part){object.geometry=object.geometry.clone();object.material=Array.isArray(object.material)?object.material.map(material=>material.clone()):object.material.clone();mapped.get(part.id).push(object);}
  });
  const missing=parts.filter(part=>mapped.get(part.id).length===0);
  if(missing.length)throw new Error(`누락된 meshName: ${missing.map(part=>part.id).join(', ')}`);
  partMeshes=mapped;
}

function centerAndScale(model){
  const box=new THREE.Box3().setFromObject(model);const size=box.getSize(new THREE.Vector3());const center=box.getCenter(new THREE.Vector3());
  model.position.sub(center);const longest=Math.max(size.x,size.y,size.z)||1;model.scale.setScalar(8.2/longest);
}

async function loadModel(){
  const loader=new GLTFLoader();
  try{
    const gltf=await loader.loadAsync('./models/sailor-pen-buffet.glb');
    const model=gltf.scene.clone(true);mapGLBParts(model);centerAndScale(model);usingFallback=false;return model;
  }catch(error){console.info('실제 GLB를 사용할 수 없어 임시 모델로 전환합니다.',error);usingFallback=true;return makeTemporaryPen();}
}

async function initViewer(){
  try{
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;ui.host.appendChild(renderer.domElement);
    scene=new THREE.Scene();scene.background=new THREE.Color(0xf1f3f5);
    camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,5.2,11.5);
    controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=6.5;controls.maxDistance=18;controls.autoRotate=!prefersReducedMotion;controls.autoRotateSpeed=.9;controls.target.set(0,0,0);
    scene.add(new THREE.HemisphereLight(0xffffff,0x8792a0,2.25));
    const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(4,7,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
    const fill=new THREE.DirectionalLight(0xc7d9ee,1.7);fill.position.set(-6,3,-3);scene.add(fill);
    const floor=new THREE.Mesh(new THREE.CircleGeometry(7,64),new THREE.ShadowMaterial({color:0x182536,opacity:.18}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.18;floor.receiveShadow=true;scene.add(floor);
    rootModel=await loadModel();scene.add(rootModel);applyPartMaterials();resizeViewer();
    addEventListener('resize',resizeViewer);renderer.setAnimationLoop(renderFrame);
    ui.loading.classList.add('is-hidden');ui.status.textContent=usingFallback?'임시 3D 모델':'실제 GLB 모델';ui.status.classList.add(usingFallback?'fallback':'ready');
  }catch(error){console.error(error);ui.loading.classList.add('is-hidden');ui.error.hidden=false;ui.status.textContent='3D 사용 불가';}
}

function resizeViewer(){if(!renderer||!camera)return;const rect=ui.host.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();}
function renderFrame(){if(!renderer||!scene||!camera)return;controls?.update();renderer.render(scene,camera);}
function setView(view){if(!camera||!controls)return;const positions={front:[0,5.2,11.5],side:[0,11,.15],angle:[7.5,5.7,8.5],reset:[0,5.2,11.5]};camera.position.set(...positions[view]);controls.target.set(0,0,0);controls.update();}

function renderPartTabs(){
  ui.partTabs.innerHTML=parts.map((part,index)=>{const color=colorById(selection[part.id]);return `<button class="part-tab ${index===activePartIndex?'is-active':''}" type="button" role="tab" aria-selected="${index===activePartIndex}" data-index="${index}"><strong>${index+1}. ${part.nameKo}</strong><small>${color.nameKo}</small><span class="part-tab-dot" style="background:${color.hex}"></span><span class="part-tab-check">✓ 선택됨</span></button>`;}).join('');
  ui.partTabs.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{activePartIndex=Number(button.dataset.index);renderUI();}));
}

function renderColors(){
  const currentPart=parts[activePartIndex];const selected=colorById(selection[currentPart.id]);
  ui.colorHeading.textContent=`${currentPart.nameKo} 색상`;ui.selectedColorLabel.textContent=`현재 선택: ${selected.nameKo}`;
  const groups=[['basic','기본 색상'],['new','신규 색상'],['special','투명·스페셜']];
  ui.colorGroups.innerHTML=groups.map(([group,label])=>{const list=colors.filter(color=>color.group===group);if(!list.length)return'';return `<section class="color-group"><div class="color-group-title">${label}<span class="group-count">${list.length}</span></div><div class="color-grid">${list.map(color=>`<button class="color-swatch ${selection[currentPart.id]===color.id?'is-selected':''}" type="button" data-color="${color.id}" aria-label="${currentPart.nameKo} 색상을 ${color.nameKo}(으)로 선택"><span class="color-circle ${color.transparent?'is-transparent':''}" style="${color.transparent?`box-shadow:inset 0 0 0 100px ${color.hex}66`:`background:${color.hex}`}"></span><span class="color-name">${selection[currentPart.id]===color.id?'✓ ':''}${color.nameKo}</span>${color.isNew?'<span class="new-badge">NEW</span>':''}</button>`).join('')}</div></section>`;}).join('');
  ui.colorGroups.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{selection[currentPart.id]=button.dataset.color;applyPartMaterials();persistSelection();renderUI();announce(`${currentPart.nameKo} 색상을 ${colorById(button.dataset.color).nameKo}(으)로 변경했습니다.`);}));
}

function renderSummary(){
  const code=combinationCode();ui.combinationCode.textContent=code;
  ui.summaryGrid.innerHTML=parts.map(part=>{const color=colorById(selection[part.id]);return `<div class="summary-item"><i style="background:${color.hex}"></i><div><strong>${part.nameKo}</strong><small>${color.nameKo}</small></div></div>`;}).join('');
  ui.staffCode.textContent=code;ui.staffList.innerHTML=parts.map(part=>{const color=colorById(selection[part.id]);return `<div><strong>${part.nameKo}</strong><br><i style="background:${color.hex}"></i>${color.nameKo}</div>`;}).join('');
}

function renderPresets(){
  ui.presetGrid.innerHTML=presets.map(preset=>`<button class="preset-button" type="button" data-preset="${preset.id}"><strong>${preset.name}</strong><span class="preset-dots">${parts.map(part=>`<i style="background:${colorById(preset.values[part.id]).hex}"></i>`).join('')}</span></button>`).join('');
  ui.presetGrid.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>applyPreset(button.dataset.preset)));
}

function renderUI(){ui.progressText.textContent=`${activePartIndex+1} / ${parts.length} 파츠 선택 중`;ui.progressBar.style.width=`${(activePartIndex+1)/parts.length*100}%`;renderPartTabs();renderColors();renderSummary();renderPresets();}
function applyPreset(id){const preset=presets.find(item=>item.id===id);if(!preset)return;selection={...preset.values};applyPartMaterials();persistSelection();renderUI();announce(`${preset.name} 조합을 적용했습니다.`);}
function randomize(){const available=colors.filter(color=>color.group!=='special'||Math.random()>.45);parts.forEach(part=>{selection[part.id]=available[Math.floor(Math.random()*available.length)].id;});applyPartMaterials();persistSelection();renderUI();announce('새로운 랜덤 조합을 만들었습니다.');}
function resetCombination(){if(!confirm('처음 조합으로 되돌릴까요?'))return;selection={...defaults};activePartIndex=0;applyPartMaterials();persistSelection();renderUI();announce('처음 조합으로 돌아왔습니다.');}
function announce(message){ui.toast.textContent=message;ui.toast.classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('is-visible'),1900);}

async function copyText(text,success){try{await navigator.clipboard.writeText(text);announce(success);}catch{prompt('아래 내용을 복사해 주세요.',text);}}

function renderShareCardCanvas(){
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,1200,900);ctx.fillStyle='#10233f';ctx.font='700 25px sans-serif';ctx.fillText('BlueBlack Pen Shop',54,58);ctx.fillStyle='#202936';ctx.font='800 43px sans-serif';ctx.fillText('세일러 펜뷔페 완성 조합',54,116);
  if(renderer)ctx.drawImage(renderer.domElement,50,150,1100,445);
  ctx.fillStyle='#ffffff';ctx.fillRect(50,620,1100,188);
  parts.forEach((part,index)=>{const color=colorById(selection[part.id]);const x=78+(index%3)*355,y=662+Math.floor(index/3)*70;ctx.fillStyle=color.hex;ctx.beginPath();ctx.arc(x,y,15,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#7d8793';ctx.stroke();ctx.fillStyle='#27313e';ctx.font='700 19px sans-serif';ctx.fillText(`${part.nameKo} · ${color.nameKo}`,x+28,y+6);});
  ctx.fillStyle='#10233f';ctx.font='800 23px monospace';ctx.fillText(combinationCode(),54,852);ctx.fillStyle='#667085';ctx.font='14px sans-serif';ctx.fillText('화면 색상은 실제 파츠와 다르게 보일 수 있습니다. 매장 실물을 함께 확인해 주세요.',54,880);return canvas;
}

function saveImage(){try{const canvas=renderShareCardCanvas();canvas.toBlob(blob=>{if(!blob)throw new Error('blob');const fileName=`blueblack-pen-${combinationCode()}.png`;if(navigator.share&&navigator.canShare){const file=new File([blob],fileName,{type:'image/png'});if(navigator.canShare({files:[file]})){navigator.share({files:[file],title:'블루블랙 펜뷔페 완성 조합'}).catch(()=>downloadBlob(blob,fileName));return;}}downloadBlob(blob,fileName);},'image/png');}catch{announce('이미지 저장에 실패했습니다. 화면 캡처를 이용해 주세요.');}}
function downloadBlob(blob,fileName){const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=fileName;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1200);announce('조합 이미지를 저장했습니다.');}

function openStaffView(){if(renderer)ui.staffPreviewImage.src=renderer.domElement.toDataURL('image/png');ui.staffView.hidden=false;document.body.style.overflow='hidden';ui.staffView.querySelector('button')?.focus();}
function closeStaffView(){ui.staffView.hidden=true;document.body.style.overflow='';el('staffHeader').focus();}

function bindEvents(){
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
  el('toggleRotate').addEventListener('click',event=>{if(!controls)return;controls.autoRotate=!controls.autoRotate;event.currentTarget.setAttribute('aria-pressed',String(controls.autoRotate));event.currentTarget.textContent=controls.autoRotate?'자동 회전 끄기':'자동 회전 켜기';});
  el('previousPart').addEventListener('click',()=>{activePartIndex=(activePartIndex+parts.length-1)%parts.length;renderUI();});
  el('nextPart').addEventListener('click',()=>{activePartIndex=(activePartIndex+1)%parts.length;renderUI();});
  el('randomPreset').addEventListener('click',randomize);
  ['resetHeader','resetResult'].forEach(id=>el(id).addEventListener('click',resetCombination));
  ['copyLink','mobileCopy'].forEach(id=>el(id).addEventListener('click',()=>copyText(location.href,'조합 링크를 복사했습니다.')));
  el('copyCode').addEventListener('click',()=>copyText(combinationCode(),'조합 코드를 복사했습니다.'));
  el('saveImage').addEventListener('click',saveImage);
  ['staffHeader','staffResult','mobileStaff'].forEach(id=>el(id).addEventListener('click',openStaffView));
  el('closeStaff').addEventListener('click',closeStaffView);
  addEventListener('keydown',event=>{if(event.key==='Escape'&&!ui.staffView.hidden)closeStaffView();});
}

loadInitialSelection();bindEvents();renderUI();persistSelection();initViewer();