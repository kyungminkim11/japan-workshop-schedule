(function kingdomNoteReportPatch(){
  if (window.__kingdomNoteReportPatch) return;
  window.__kingdomNoteReportPatch = true;

  const ITEM_ID = 'a8';
  const REVISION = 2;
  const DRAFT_KEY = 'workshopReportDraftsV1';
  const PENDING_KEY = 'workshopReportPendingV1';
  let syncing = false;
  let originalLoadState = null;

  const CONTENT = {
    version: 1,
    scheduleItemId: ITEM_ID,
    contentRevision: REVISION,
    status: 'writing',
    visitPurpose: '일본의 고급 필기구 전문점이 신품과 중고 만년필을 어떤 기준으로 진열하고 설명하는지 관찰하고, 블루블랙 펜샵의 상품 안내·중고품 상태 표기·브랜드 연출에 적용할 수 있는 요소를 확인하기 위해 방문했다.',
    storeOverview: '킹덤노트는 신주쿠에 위치한 고급 필기구 전문 매장으로, 전면 유리창과 자동문을 통해 외부에서도 내부 진열을 한눈에 볼 수 있었다. 매장 전체는 화이트·실버·대리석 계열로 통일되어 있었고, 입구의 선명한 파란색 KINGDOM NOTE 로고 매트가 브랜드의 첫인상을 명확하게 만들었다. 벽면 대부분을 조명이 들어오는 대형 유리 진열장으로 구성해 실제 면적보다 넓고 밝게 느껴졌으며, 일반 판매점보다는 고급 필기구 갤러리나 쇼룸에 가까운 분위기였다.',
    products: '사진에서 Aurora, Sailor, Parker, Caran d’Ache, Pelikan 등 다양한 고급 필기구 브랜드를 확인했다. Aurora 진열대에는 클래식한 블랙·골드 제품과 블루·오렌지·그린·레드 계열의 화려한 마블 레진 제품이 함께 있었고, 사진에 표시된 가격은 약 53,900엔부터 176,000엔까지였다. Sailor 진열대에는 VEILIO, SHIKIORI, Rencontre 계열로 보이는 반투명·파스텔·마블 색상의 만년필이 정돈되어 있었으며 약 44,000엔부터 80,300엔대의 가격표가 보였다. 중고 코너에서는 Parker 듀오폴드 계열과 Caran d’Ache 에크리도르 계열을 확인했으며, Caran d’Ache 중고 제품은 약 21,800엔부터 82,800엔, Parker 제품은 약 23,800엔부터 46,800엔 수준으로 표시되어 있었다. 화려한 수지 제품, 클래식한 블랙·골드 제품, 정교한 금속 가공 제품까지 폭넓게 비교할 수 있었다.',
    display: '제품은 벽면 유리장 안에서 투명 아크릴 받침대에 한 자루씩 눕혀 전시되어 있었고, 상품 사이에 충분한 간격을 두어 각 제품의 색상과 소재, 금속 장식이 잘 보였다. 흰색 배경과 밝은 내부 조명이 마블 레진과 금속 표면의 질감을 강조했으며, 브랜드·모델명·간단한 설명·가격·신품 또는 중고 여부가 적힌 개별 가격표를 제품 가까이에 배치했다. 중고 상품은 Used 표시와 함께 Good, Average, Excellent, Near Mint처럼 상태 등급을 구분해 가격과 컨디션을 비교하기 쉬웠다. 한쪽에는 Pelikan 4001 잉크병과 목제 펠리칸 장식물을 함께 배치해 브랜드의 역사와 이미지를 작은 전시처럼 보여주었고, 카운터 주변에는 SAMPLE이라고 표시된 여러 종류의 노트와 종이를 비치해 필기감과 종이 차이를 비교할 수 있도록 구성했다.',
    service: '상품마다 브랜드명, 모델명, 가격, 신품·중고 구분과 중고 상태 등급을 구체적으로 표시해 직원에게 질문하기 전에도 기본 정보를 스스로 파악할 수 있었다. 매장 내 결제 가능 수단 안내가 일본어와 영어로 준비되어 있었고, 방문 당시 Apple Pay는 지원되지 않는 것으로 확인했다. 이런 사전 안내는 고가 상품을 처음 접하는 고객의 부담을 줄이고 반복 문의를 줄이는 데 효과적으로 보였다. 샘플 노트와 종이를 별도로 마련한 점도 단순히 펜만 보여주는 데 그치지 않고 실제 사용 경험까지 연결하려는 운영 방식으로 느껴졌다.',
    purchases: '이번 기록에는 별도의 구매·선물 내역이 아직 입력되어 있지 않다. 방문 당시에는 상품 구매보다 신품·중고 필기구의 구성, 가격표, 상태 등급과 진열 방식을 촬영하고 조사하는 데 집중했다. 추후 구매 내역이나 직원 상담 내용이 확인되면 영수증과 함께 보완할 수 있다.',
    learnings: '블루블랙 펜샵에도 중고 또는 전시 상품을 운영할 경우 상태 기준을 등급화하고, 제품명·가격·상태·구성품·사용 흔적을 동일한 형식의 카드로 표시하면 고객 신뢰를 높일 수 있다. 대표 제품은 여러 자루를 빽빽하게 놓기보다 투명 받침대와 여백을 활용해 한 자루씩 전시하면 고급스러운 인상을 줄 수 있다. 1층 입구에는 브랜드 로고 매트와 촬영 가능 여부, 결제 수단, 면세·택스리펀드 여부를 한·영·일로 안내하고, 통창이나 입구에서 주요 취급 브랜드가 보이도록 정리하는 것이 좋다. 제품 설명 공간이 부족한 경우 핵심 특징 한 줄과 QR코드를 함께 두어 온라인 상품 페이지, 촉 종류, 충전 방식, 관리법과 다국어 설명으로 연결할 수 있다. 또한 Pelikan 전시처럼 잉크병·과거 패키지·브랜드 오브제를 활용한 작은 역사 코너를 만들면 상품 판매를 넘어 브랜드 이야기를 전달할 수 있다.',
    strengths: '작은 면적을 전면 유리창, 밝은 색상, 벽면 전체 진열과 조명으로 효율적으로 활용해 개방감과 전문성을 동시에 만들었다. 신품과 중고 제품을 섞어 놓지 않고 개별 정보와 상태를 명확히 표시해 고가 중고 필기구에 필요한 신뢰를 확보한 점이 특히 인상적이었다. 상품을 한 자루씩 보여주는 진열, 일관된 가격표, 브랜드 소품과 샘플 노트가 결합되어 단순 판매 공간보다 감상과 비교가 가능한 전문 갤러리처럼 느껴졌다.',
    improvements: '유리 진열장 특성상 조명과 주변 환경이 반사되어 일부 제품과 가격표를 가까이에서 보기 어려운 구역이 있었고, 가격표의 설명 글자가 작아 외국인이나 시력이 좋지 않은 고객은 읽기 어려울 수 있었다. 블루블랙 펜샵에 유사한 진열을 적용할 때는 반사를 줄이는 조명 각도와 무광 배경을 사용하고, 가격·촉·충전 방식·상태 등 핵심 정보는 더 큰 글자로 표시하는 것이 좋다. 중고품 등급은 영문 등급만 사용하기보다 각 등급의 기준과 대표적인 흠집 예시를 함께 안내하면 고객이 상태를 더 정확히 이해할 수 있다.',
    finalSummary: '킹덤노트는 전면 유리창, 화이트·실버 중심의 인테리어와 조명식 벽면 진열장을 활용해 고급 필기구를 갤러리처럼 보여주는 전문 매장이었다. Aurora, Sailor, Parker, Caran d’Ache, Pelikan 등 다양한 브랜드의 신품과 중고품을 취급했으며, 제품별 브랜드·모델·가격과 Used 상태 등급을 명확하게 표시해 비교와 신뢰를 높였다. Pelikan 잉크와 브랜드 오브제, 샘플 노트처럼 상품의 역사와 실제 사용 경험을 함께 보여준 점도 인상적이었다. 블루블랙 펜샵에는 통일된 제품 정보 카드, 중고품 상태 기준, 여백 있는 대표 상품 진열, 다국어 QR 설명, 브랜드 역사 코너와 입구 안내를 우선 적용할 수 있다.'
  };

  function readMap(key){
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function writeMap(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function currentStore(){
    if (typeof state !== 'object' || !state) return null;
    if (!state.shopping || typeof state.shopping !== 'object' || Array.isArray(state.shopping)) state.shopping = {};
    if (!state.shopping.reportProjects || typeof state.shopping.reportProjects !== 'object' || Array.isArray(state.shopping.reportProjects)) state.shopping.reportProjects = {};
    return state.shopping.reportProjects;
  }

  function enrichedReport(current = {}){
    return {
      ...current,
      ...CONTENT,
      status: current.status === 'done' ? 'done' : 'writing',
      updatedAt: new Date().toISOString()
    };
  }

  function applyContent(){
    const store = currentStore();
    if (!store || !Array.isArray(state.schedule) || !state.schedule.some((item) => item.id === ITEM_ID)) return false;
    const current = store[ITEM_ID] || {};
    if (Number(current.contentRevision || 0) >= REVISION) return true;

    const report = enrichedReport(current);
    store[ITEM_ID] = report;

    const drafts = readMap(DRAFT_KEY);
    drafts[ITEM_ID] = report;
    writeMap(DRAFT_KEY, drafts);

    const pending = readMap(PENDING_KEY);
    pending[ITEM_ID] = report;
    writeMap(PENDING_KEY, pending);

    try {
      if (typeof render === 'function') render();
      window.WorkshopReports?.render?.();
    } catch {}

    setTimeout(syncContent, 250);
    return true;
  }

  async function syncContent(){
    if (syncing || !navigator.onLine || typeof role === 'undefined' || role !== 'admin' || typeof token === 'undefined' || !token) return;
    syncing = true;
    try {
      if (window.WorkshopReports?.flush) {
        await window.WorkshopReports.flush();
      } else if (typeof saveState === 'function') {
        await saveState();
      }
    } catch (error) {
      console.warn('킹덤노트 보고서 자동 반영 대기:', error);
    } finally {
      syncing = false;
    }
  }

  function patchLoadState(){
    if (typeof loadState !== 'function' || originalLoadState) return false;
    originalLoadState = loadState;
    loadState = async function kingdomAwareLoadState(){
      const result = await originalLoadState.apply(this, arguments);
      applyContent();
      return result;
    };
    return true;
  }

  function boot(){
    patchLoadState();
    applyContent();
    let attempts = 0;
    const timer = setInterval(() => {
      patchLoadState();
      if (applyContent() || attempts++ > 240) clearInterval(timer);
    }, 250);
    window.addEventListener('online', () => { applyContent(); syncContent(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
