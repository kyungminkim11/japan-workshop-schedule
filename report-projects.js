(function workshopReportProjectsPatch(){
  if (window.__workshopReportProjectsPatch) return;
  window.__workshopReportProjectsPatch = true;

  const VERSION = 1;
  const CACHE_KEY = 'workshopOfflineSnapshotV1';
  const DRAFT_KEY = 'workshopReportDraftsV1';
  const PENDING_KEY = 'workshopReportPendingV1';
  const REPORT_STORE_KEY = 'reportProjects';
  const REPORT_FIELDS = [
    ['visitPurpose', '방문 목적', '이 매장을 방문한 목적과 사전에 확인하려 했던 내용을 적어주세요.'],
    ['storeOverview', '매장 특징과 첫인상', '입지, 규모, 분위기, 주요 고객층, 다른 매장과 구별되는 특징을 적어주세요.'],
    ['products', '대표 상품·브랜드', '눈에 띈 브랜드, 한정품, 인기 상품, 가격대와 상품 구성을 적어주세요.'],
    ['display', '진열·공간 구성', '동선, 진열 방식, 조명, 안내물, 체험 공간 등 매장 구성을 적어주세요.'],
    ['service', '고객 응대·운영 방식', '직원 응대, 상담 과정, 시필·체험 방식, 계산과 포장 방식 등을 적어주세요.'],
    ['purchases', '구매·선물·상담 내용', '구매한 상품, 받은 선물, 매장 관계자와 나눈 대화나 상담 내용을 적어주세요.'],
    ['learnings', '블루블랙 펜샵 참고점', '우리 매장에 적용할 수 있는 아이디어와 실무적으로 참고할 점을 적어주세요.'],
    ['strengths', '좋았던 점', '인상적이었던 요소와 잘 운영되고 있다고 느낀 부분을 적어주세요.'],
    ['improvements', '아쉬운 점·개선 아이디어', '불편했던 점, 보완할 점, 우리 매장에서 다르게 적용할 부분을 적어주세요.'],
    ['finalSummary', '보고서용 최종 정리', '회사 보고서에 바로 옮길 수 있도록 핵심 내용과 결론을 문장으로 정리해주세요.']
  ];
  const BUSINESS_PATTERNS = [
    /kingdom\s*note|킹덤\s*노트/i,
    /itoya|이토야/i,
    /kakimori|카키모리/i,
    /bungubox|분구\s*박스/i,
    /ancora|앙코라/i,
    /shosaikan|쇼사이칸/i,
    /hightide|하이타이드/i,
    /shibuya\s*loft|시부야\s*로프트/i
  ];
  const DAY_ORDER = ['0617', '0618', '0619', '0620'];
  const STATUS_META = {
    todo: { label: '작성 전', icon: '○' },
    writing: { label: '작성 중', icon: '◐' },
    done: { label: '작성 완료', icon: '●' }
  };

  let activeReportId = '';
  let autosaveTimer = 0;
  let enhanceTimer = 0;
  let syncing = false;
  let syncMessageTimer = 0;
  let originalRender = null;
  let originalLoadState = null;

  const readJson = (key, fallback = {}) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };
  const writeJson = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };
  const safe = (value) => String(value == null ? '' : value).trim();
  const isoNow = () => new Date().toISOString();
  const dayLabel = (dayId) => ({ '0617': '1일차 · 6/17', '0618': '2일차 · 6/18', '0619': '3일차 · 6/19', '0620': '4일차 · 6/20' }[dayId] || dayId || '일정');
  const reportStatus = (value) => STATUS_META[value] ? value : 'todo';

  function ensureStyle(){
    if (document.querySelector('link[href*="report-projects.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'report-projects.css?v=20260620-report-1';
    document.head.appendChild(link);
  }

  function ensureReportStore(){
    if (typeof state !== 'object' || !state) return {};
    if (!state.shopping || typeof state.shopping !== 'object' || Array.isArray(state.shopping)) state.shopping = {};
    if (!state.shopping[REPORT_STORE_KEY] || typeof state.shopping[REPORT_STORE_KEY] !== 'object' || Array.isArray(state.shopping[REPORT_STORE_KEY])) state.shopping[REPORT_STORE_KEY] = {};
    return state.shopping[REPORT_STORE_KEY];
  }

  function getRemoteReport(itemId){
    return ensureReportStore()[itemId] || null;
  }

  function newestReport(itemId){
    const remote = getRemoteReport(itemId) || {};
    const draft = readJson(DRAFT_KEY, {})[itemId] || {};
    const remoteTime = Date.parse(remote.updatedAt || 0) || 0;
    const draftTime = Date.parse(draft.updatedAt || 0) || 0;
    return draftTime > remoteTime ? { ...remote, ...draft, hasLocalDraft: true } : { ...draft, ...remote, hasLocalDraft: false };
  }

  function itemByReportId(itemId){
    return Array.isArray(state?.schedule) ? state.schedule.find((item) => item.id === itemId) || null : null;
  }

  function isBusinessItem(item){
    if (!item) return false;
    if (getRemoteReport(item.id) || readJson(DRAFT_KEY, {})[item.id] || readJson(PENDING_KEY, {})[item.id]) return true;
    const text = `${item.title || ''} ${item.place || ''}`;
    return BUSINESS_PATTERNS.some((pattern) => pattern.test(text));
  }

  function reportItems(){
    return (Array.isArray(state?.schedule) ? state.schedule : [])
      .filter(isBusinessItem)
      .slice()
      .sort((a, b) => {
        const dayDiff = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
        if (dayDiff) return dayDiff;
        return state.schedule.indexOf(a) - state.schedule.indexOf(b);
      });
  }

  function reportDefaults(item){
    return {
      version: VERSION,
      scheduleItemId: item.id,
      status: 'todo',
      visitPurpose: '',
      storeOverview: '',
      products: '',
      display: '',
      service: '',
      purchases: '',
      learnings: '',
      strengths: '',
      improvements: '',
      finalSummary: '',
      createdAt: isoNow(),
      updatedAt: ''
    };
  }

  function completion(report){
    const filled = REPORT_FIELDS.filter(([key]) => safe(report?.[key])).length;
    return { filled, total: REPORT_FIELDS.length, percent: Math.round(filled / REPORT_FIELDS.length * 100) };
  }

  function cacheSnapshot(){
    if (typeof state !== 'object' || !state || !token) return;
    writeJson(CACHE_KEY, { version: VERSION, savedAt: isoNow(), role, selectedDay, state });
  }

  function hydrateOfflineSnapshot(){
    if (navigator.onLine || !token || typeof normalizeState !== 'function') return false;
    const cached = readJson(CACHE_KEY, null);
    if (!cached?.state) return false;
    normalizeState(cached.state);
    if (cached.selectedDay && DAY_ORDER.includes(cached.selectedDay)) selectedDay = cached.selectedDay;
    if (typeof originalRender === 'function') originalRender();
    else if (typeof render === 'function') render();
    return true;
  }

  function pendingMap(){
    const value = readJson(PENDING_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function draftMap(){
    const value = readJson(DRAFT_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function ensureConnectionBar(){
    let bar = document.getElementById('workshopConnectionBar');
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'workshopConnectionBar';
    bar.className = 'connection-bar';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.innerHTML = '<span class="connection-dot" aria-hidden="true"></span><strong></strong><span class="connection-detail"></span><button type="button" class="connection-sync-btn">동기화</button>';
    document.querySelector('.app-header')?.insertAdjacentElement('afterend', bar);
    bar.querySelector('.connection-sync-btn').addEventListener('click', flushPendingReports);
    return bar;
  }

  function updateConnectionBar(message = ''){
    const bar = ensureConnectionBar();
    if (!bar) return;
    const count = Object.keys(pendingMap()).length;
    const title = bar.querySelector('strong');
    const detail = bar.querySelector('.connection-detail');
    const button = bar.querySelector('button');
    bar.classList.toggle('is-offline', !navigator.onLine);
    bar.classList.toggle('is-syncing', syncing);
    bar.classList.toggle('has-pending', count > 0);
    if (!navigator.onLine) {
      bar.hidden = false;
      title.textContent = '오프라인 모드';
      detail.textContent = count ? `저장 대기 ${count}건 · 인터넷 연결 시 자동 반영` : '입력 내용은 이 기기에 저장됩니다.';
      button.hidden = true;
      return;
    }
    if (syncing) {
      bar.hidden = false;
      title.textContent = '보고서 동기화 중';
      detail.textContent = count ? `${count}건을 서버에 반영하고 있습니다.` : '서버 상태를 확인하고 있습니다.';
      button.hidden = true;
      return;
    }
    if (count) {
      bar.hidden = false;
      title.textContent = '동기화 대기';
      detail.textContent = `${count}건의 오프라인 저장 내용이 남아 있습니다.`;
      button.hidden = false;
      return;
    }
    if (message) {
      bar.hidden = false;
      title.textContent = message;
      detail.textContent = '모든 내용이 최신 상태입니다.';
      button.hidden = true;
      clearTimeout(syncMessageTimer);
      syncMessageTimer = setTimeout(() => { bar.hidden = true; }, 2600);
      return;
    }
    bar.hidden = true;
  }

  function ensureReportPanel(){
    let panel = document.getElementById('reportProjectPanel');
    if (panel) return panel;
    const home = document.getElementById('homePanel');
    if (!home) return null;
    panel = document.createElement('section');
    panel.id = 'reportProjectPanel';
    panel.className = 'panel admin-only report-project-panel';
    panel.dataset.appView = 'home';
    panel.hidden = true;
    panel.innerHTML = '<div class="panel-title-row"><div><p class="eyebrow">WORKSHOP REPORT</p><h2>방문 매장 보고서</h2><p class="muted">일정과 연결된 매장별 프로젝트입니다. 카드를 눌러 현장 기록을 정리하세요.</p></div><span id="reportProjectSummary" class="report-summary-chip"></span></div><div id="reportProjectGroups" class="report-project-groups"></div>';
    home.insertAdjacentElement('afterend', panel);
    return panel;
  }

  function renderReportPanel(){
    const panel = ensureReportPanel();
    if (!panel) return;
    panel.hidden = role !== 'admin' || activeView !== 'home';
    if (role !== 'admin') return;
    const items = reportItems();
    const reports = ensureReportStore();
    const signature = items.map((item) => {
      const r = newestReport(item.id);
      return `${item.id}:${reportStatus(r.status)}:${r.updatedAt || ''}`;
    }).join('|');
    if (panel.dataset.signature === signature) return;
    panel.dataset.signature = signature;
    const groups = panel.querySelector('#reportProjectGroups');
    groups.replaceChildren();
    const doneCount = items.filter((item) => reportStatus(newestReport(item.id).status) === 'done').length;
    panel.querySelector('#reportProjectSummary').textContent = `${doneCount}/${items.length} 완료`;
    if (!items.length) {
      groups.innerHTML = '<div class="empty-state"><strong>보고서 대상 매장이 없습니다.</strong><p>일정에 킹덤노트, 이토야, 카키모리 같은 방문 매장을 추가하면 자동으로 생성됩니다.</p></div>';
      return;
    }
    DAY_ORDER.forEach((day) => {
      const dayItems = items.filter((item) => item.day === day);
      if (!dayItems.length) return;
      const group = document.createElement('section');
      group.className = 'report-day-group';
      const heading = document.createElement('div');
      heading.className = 'report-day-heading';
      heading.innerHTML = `<strong>${dayLabel(day)}</strong><span>${dayItems.length}개 매장</span>`;
      const grid = document.createElement('div');
      grid.className = 'report-card-grid';
      dayItems.forEach((item) => {
        const report = { ...reportDefaults(item), ...newestReport(item.id) };
        const progress = completion(report);
        const status = STATUS_META[reportStatus(report.status)];
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `report-project-card status-${reportStatus(report.status)}`;
        card.dataset.reportItemId = item.id;
        card.innerHTML = `<span class="report-card-top"><span>${item.time}</span><span class="report-status">${status.icon} ${status.label}</span></span><strong>${item.title}</strong><small>${item.place}</small><span class="report-progress"><i style="width:${progress.percent}%"></i></span><span class="report-progress-label">${progress.filled}/${progress.total} 항목 작성</span>`;
        card.addEventListener('click', () => openReport(item.id));
        grid.appendChild(card);
      });
      group.append(heading, grid);
      groups.appendChild(group);
    });
  }

  function ensureReportDialog(){
    let dialog = document.getElementById('reportProjectDialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'reportProjectDialog';
    dialog.className = 'report-project-dialog';
    dialog.innerHTML = `
      <div class="report-dialog-shell">
        <header class="report-dialog-header">
          <button type="button" class="ghost report-back-btn" aria-label="보고서 닫기">←</button>
          <div><p class="eyebrow">STORE REPORT PROJECT</p><h2 id="reportDialogTitle">매장 보고서</h2><p id="reportDialogMeta"></p></div>
          <span id="reportDialogConnection" class="report-dialog-connection"></span>
        </header>
        <div class="report-dialog-scroll">
          <section class="report-linked-card">
            <div><strong>일정 연동 정보</strong><p id="reportScheduleMemo" class="muted"></p></div>
            <div id="reportLinkedStats" class="report-linked-stats"></div>
            <div id="reportLinkedPhotos" class="report-linked-photos"></div>
            <div class="button-row"><button id="reportOpenScheduleBtn" type="button" class="ghost">일정 상세 보기</button><a id="reportMapBtn" class="ghost" target="_blank" rel="noreferrer">지도 열기</a></div>
          </section>
          <form id="reportProjectForm" class="report-project-form">
            <label class="report-status-field">작성 상태<select id="reportStatusInput"><option value="todo">작성 전</option><option value="writing">작성 중</option><option value="done">작성 완료</option></select></label>
            <div id="reportFields"></div>
          </form>
        </div>
        <footer class="report-dialog-footer">
          <div><strong id="reportSaveState">저장 전</strong><span id="reportSaveDetail">입력하면 이 기기에 자동 임시 저장됩니다.</span></div>
          <button id="reportSaveBtn" type="button">보고서 저장</button>
        </footer>
      </div>`;
    document.body.appendChild(dialog);
    const fields = dialog.querySelector('#reportFields');
    REPORT_FIELDS.forEach(([key, label, placeholder]) => {
      const section = document.createElement('label');
      section.className = 'report-field';
      section.innerHTML = `<span>${label}</span><textarea name="${key}" data-report-field="${key}" placeholder="${placeholder}"></textarea>`;
      fields.appendChild(section);
    });
    dialog.querySelector('.report-back-btn').addEventListener('click', closeReport);
    dialog.querySelector('#reportSaveBtn').addEventListener('click', () => saveActiveReport(false));
    dialog.querySelector('#reportOpenScheduleBtn').addEventListener('click', openActiveScheduleDetail);
    dialog.querySelector('#reportProjectForm').addEventListener('input', scheduleAutosave);
    dialog.querySelector('#reportProjectForm').addEventListener('change', scheduleAutosave);
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeReport(); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) closeReport(); });
    return dialog;
  }

  function linkedInfo(item){
    const linkedPhotos = (Array.isArray(photos) ? photos : []).filter((photo) => (photo.itemId || photo.item_id) === item.id);
    const linkedCheckins = (Array.isArray(state?.checkins) ? state.checkins : []).filter((entry) => entry.itemId === item.id);
    const note = safe(state?.notes?.[item.id]);
    return { linkedPhotos, linkedCheckins, note };
  }

  function fillReportDialog(item){
    const dialog = ensureReportDialog();
    const report = { ...reportDefaults(item), ...newestReport(item.id) };
    const linked = linkedInfo(item);
    dialog.querySelector('#reportDialogTitle').textContent = item.title;
    dialog.querySelector('#reportDialogMeta').textContent = `${dayLabel(item.day)} · ${item.time} · ${item.place}`;
    dialog.querySelector('#reportStatusInput').value = reportStatus(report.status);
    REPORT_FIELDS.forEach(([key]) => { dialog.querySelector(`[data-report-field="${key}"]`).value = report[key] || ''; });
    dialog.querySelector('#reportScheduleMemo').textContent = linked.note || '일정 메모가 아직 없습니다. 보고서 내용은 아래에서 별도로 작성할 수 있습니다.';
    dialog.querySelector('#reportLinkedStats').innerHTML = `<span><strong>${linked.linkedPhotos.length}</strong>사진</span><span><strong>${linked.linkedCheckins.length}</strong>체크인</span><span><strong>${linked.note ? '1' : '0'}</strong>일정 메모</span>`;
    const photoBox = dialog.querySelector('#reportLinkedPhotos');
    photoBox.replaceChildren();
    linked.linkedPhotos.slice(0, 8).forEach((photo) => {
      const image = document.createElement('img');
      image.src = photo.dataUrl || photo.data_url;
      image.alt = photo.fileName || photo.file_name || `${item.title} 사진`;
      image.loading = 'lazy';
      photoBox.appendChild(image);
    });
    dialog.querySelector('#reportMapBtn').href = typeof mapUrl === 'function' ? mapUrl(item) : (item.map || '#');
    const stateLabel = dialog.querySelector('#reportSaveState');
    const stateDetail = dialog.querySelector('#reportSaveDetail');
    if (report.hasLocalDraft) {
      stateLabel.textContent = '이 기기에 임시 저장됨';
      stateDetail.textContent = '저장 버튼을 누르면 인터넷 연결 시 서버에 반영됩니다.';
    } else if (report.updatedAt) {
      stateLabel.textContent = '서버 저장 완료';
      stateDetail.textContent = new Date(report.updatedAt).toLocaleString('ko-KR');
    } else {
      stateLabel.textContent = '작성 전';
      stateDetail.textContent = '입력하면 이 기기에 자동 임시 저장됩니다.';
    }
    updateDialogConnection();
  }

  function openReport(itemId){
    if (role !== 'admin') return;
    const item = itemByReportId(itemId);
    if (!item) return;
    activeReportId = itemId;
    const dialog = ensureReportDialog();
    fillReportDialog(item);
    document.body.classList.add('report-dialog-open');
    if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
    else dialog.setAttribute('open', '');
    setTimeout(() => dialog.querySelector('textarea')?.focus({ preventScroll: true }), 80);
  }

  function closeReport(){
    const dialog = document.getElementById('reportProjectDialog');
    if (!dialog) return;
    saveDraftFromForm();
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    document.body.classList.remove('report-dialog-open');
    activeReportId = '';
    renderReportPanel();
  }

  function gatherActiveReport(){
    const item = itemByReportId(activeReportId);
    const dialog = document.getElementById('reportProjectDialog');
    if (!item || !dialog) return null;
    const existing = { ...reportDefaults(item), ...newestReport(item.id) };
    const next = {
      ...existing,
      version: VERSION,
      scheduleItemId: item.id,
      status: reportStatus(dialog.querySelector('#reportStatusInput').value),
      updatedAt: isoNow()
    };
    REPORT_FIELDS.forEach(([key]) => { next[key] = safe(dialog.querySelector(`[data-report-field="${key}"]`).value); });
    if (next.status === 'todo' && REPORT_FIELDS.some(([key]) => next[key])) next.status = 'writing';
    delete next.hasLocalDraft;
    return next;
  }

  function saveDraftFromForm(){
    const report = gatherActiveReport();
    if (!report) return null;
    const drafts = draftMap();
    drafts[report.scheduleItemId] = report;
    writeJson(DRAFT_KEY, drafts);
    ensureReportStore()[report.scheduleItemId] = report;
    cacheSnapshot();
    const dialog = document.getElementById('reportProjectDialog');
    if (dialog) {
      dialog.querySelector('#reportSaveState').textContent = '이 기기에 임시 저장됨';
      dialog.querySelector('#reportSaveDetail').textContent = '저장 버튼을 누르면 서버 동기화를 시도합니다.';
    }
    return report;
  }

  function scheduleAutosave(){
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveDraftFromForm, 350);
  }

  async function saveActiveReport(silent = false){
    const report = saveDraftFromForm();
    if (!report) return;
    const pending = pendingMap();
    pending[report.scheduleItemId] = report;
    writeJson(PENDING_KEY, pending);
    updateConnectionBar();
    updateDialogConnection();
    if (!navigator.onLine) {
      const dialog = document.getElementById('reportProjectDialog');
      dialog.querySelector('#reportSaveState').textContent = '오프라인 저장 완료';
      dialog.querySelector('#reportSaveDetail').textContent = '인터넷에 연결되면 자동으로 서버에 반영됩니다.';
      renderReportPanel();
      return;
    }
    await flushPendingReports({ keepDialog: true, silent });
  }

  function updateDialogConnection(){
    const badge = document.getElementById('reportDialogConnection');
    if (!badge) return;
    if (!navigator.onLine) {
      badge.textContent = '오프라인';
      badge.className = 'report-dialog-connection offline';
    } else if (syncing) {
      badge.textContent = '동기화 중';
      badge.className = 'report-dialog-connection syncing';
    } else {
      badge.textContent = '온라인';
      badge.className = 'report-dialog-connection online';
    }
  }

  async function flushPendingReports(options = {}){
    const pending = pendingMap();
    const ids = Object.keys(pending);
    if (!navigator.onLine || !ids.length || role !== 'admin' || !token || syncing) {
      updateConnectionBar();
      updateDialogConnection();
      return;
    }
    syncing = true;
    updateConnectionBar();
    updateDialogConnection();
    const reopenId = options.keepDialog ? activeReportId : '';
    try {
      const latest = await rpc('workshop_get_state', { p_token: token });
      if (!latest?.ok) throw new Error(latest?.message || '최신 데이터 확인 실패');
      normalizeState(latest.data || {});
      if (Array.isArray(latest.photos)) photos = latest.photos;
      const store = ensureReportStore();
      ids.forEach((id) => { store[id] = pending[id]; });
      await saveState();
      const drafts = draftMap();
      ids.forEach((id) => { delete drafts[id]; });
      writeJson(DRAFT_KEY, drafts);
      writeJson(PENDING_KEY, {});
      cacheSnapshot();
      if (typeof originalRender === 'function') originalRender();
      else render();
      afterRender();
      updateConnectionBar('동기화 완료');
      if (reopenId && itemByReportId(reopenId)) {
        activeReportId = reopenId;
        fillReportDialog(itemByReportId(reopenId));
        const dialog = ensureReportDialog();
        if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
      }
    } catch (error) {
      updateConnectionBar('동기화 실패');
      const dialog = document.getElementById('reportProjectDialog');
      if (dialog && activeReportId) {
        dialog.querySelector('#reportSaveState').textContent = '기기에 저장됨';
        dialog.querySelector('#reportSaveDetail').textContent = `서버 반영 대기 · ${error.message}`;
      }
    } finally {
      syncing = false;
      updateDialogConnection();
      updateConnectionBar();
    }
  }

  function openActiveScheduleDetail(){
    const item = itemByReportId(activeReportId);
    if (!item) return;
    const id = item.id;
    closeReport();
    selectedDay = item.day;
    selectedItemId = id;
    activeView = 'schedule';
    storage.set('workshopView', activeView);
    render();
    setTimeout(() => document.getElementById('detailPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  function decorateScheduleCards(){
    if (role !== 'admin') return;
    const items = typeof dayItems === 'function' ? dayItems() : [];
    document.querySelectorAll('#scheduleList .schedule-card').forEach((card, index) => {
      const item = items[index];
      if (!item || !isBusinessItem(item)) return;
      card.dataset.reportItemId = item.id;
      card.classList.add('has-report-project');
      if (!card.querySelector('.report-card-hint')) {
        const hint = document.createElement('span');
        hint.className = 'report-card-hint';
        hint.textContent = '보고서 열기 ›';
        card.querySelector('.schedule-body')?.appendChild(hint);
      }
      card.onclick = () => openReport(item.id);
    });
  }

  function decorateRouteStops(){
    if (role !== 'admin') return;
    const items = typeof dayItems === 'function' ? dayItems() : [];
    document.querySelectorAll('#routeStops button').forEach((button, index) => {
      const item = items[index];
      if (!item || !isBusinessItem(item)) return;
      button.dataset.reportItemId = item.id;
      button.classList.add('has-report-project');
      button.onclick = () => openReport(item.id);
    });
  }

  function findTimelineBusinessItem(card){
    const text = safe(card?.textContent);
    return reportItems().find((item) => text.includes(item.title) || (item.place && text.includes(item.place)));
  }

  function decorateTimelineCards(){
    if (role !== 'admin') return;
    document.querySelectorAll('#timelineList .timeline-card, #homeTimelinePreview .timeline-card').forEach((card) => {
      if (card.dataset.reportDecorated === '1') return;
      const item = findTimelineBusinessItem(card);
      if (!item) return;
      card.dataset.reportDecorated = '1';
      card.dataset.reportItemId = item.id;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ghost small timeline-report-btn';
      button.textContent = '매장 보고서';
      button.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); openReport(item.id); });
      card.appendChild(button);
    });
  }

  function decorateDetail(){
    if (role !== 'admin') return;
    const item = typeof selectedItem === 'function' ? selectedItem() : null;
    const wrap = document.getElementById('detailContent');
    if (!item || !wrap || !isBusinessItem(item) || wrap.querySelector('.detail-report-btn')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'detail-report-btn';
    button.textContent = '이 매장 보고서 작성';
    button.addEventListener('click', () => openReport(item.id));
    wrap.querySelector('.button-row')?.appendChild(button);
  }

  function afterRender(){
    cacheSnapshot();
    renderReportPanel();
    decorateScheduleCards();
    decorateRouteStops();
    decorateTimelineCards();
    decorateDetail();
    updateConnectionBar();
  }

  function scheduleEnhance(){
    clearTimeout(enhanceTimer);
    enhanceTimer = setTimeout(afterRender, 60);
  }

  function patchCore(){
    if (typeof render === 'function' && !originalRender) {
      originalRender = render;
      render = function reportAwareRender(){
        const result = originalRender.apply(this, arguments);
        scheduleEnhance();
        return result;
      };
    }
    if (typeof loadState === 'function' && !originalLoadState) {
      originalLoadState = loadState;
      loadState = async function offlineAwareLoadState(){
        if (!navigator.onLine) {
          const restored = hydrateOfflineSnapshot();
          updateConnectionBar();
          if (restored) return;
        }
        const result = await originalLoadState.apply(this, arguments);
        cacheSnapshot();
        scheduleEnhance();
        return result;
      };
    }
  }

  function registerOfflineWorker(){
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((registration) => registration.update()).catch(() => {});
    navigator.storage?.persist?.().catch(() => {});
  }

  function boot(){
    if (typeof render !== 'function' || !document.getElementById('appPanel')) {
      setTimeout(boot, 80);
      return;
    }
    ensureStyle();
    patchCore();
    ensureConnectionBar();
    ensureReportPanel();
    ensureReportDialog();
    registerOfflineWorker();
    if (!navigator.onLine) hydrateOfflineSnapshot();
    afterRender();
    const observer = new MutationObserver(scheduleEnhance);
    observer.observe(document.getElementById('appPanel'), { childList: true, subtree: true });
    window.addEventListener('offline', () => { saveDraftFromForm(); updateConnectionBar(); updateDialogConnection(); });
    window.addEventListener('online', () => { updateConnectionBar(); updateDialogConnection(); flushPendingReports({ keepDialog: Boolean(activeReportId) }); });
    window.addEventListener('beforeunload', saveDraftFromForm);
    window.WorkshopReports = { open: openReport, isReportItem: (id) => isBusinessItem(itemByReportId(id)), flush: flushPendingReports, render: renderReportPanel };
    if (navigator.onLine) setTimeout(() => flushPendingReports({ keepDialog: false, silent: true }), 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
