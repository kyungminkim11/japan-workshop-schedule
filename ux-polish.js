(function workshopUxPolish(){
  if (window.__workshopUxPolish) return;

  function ensureStyle() {
    if (document.querySelector('link[href*="ux-polish.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'ux-polish.css?v=20260619-ux-1';
    document.head.appendChild(link);
  }
  ensureStyle();

  const VIEW_COPY = {
    home: { eyebrow: 'HOME', title: '오늘 한눈에', text: '오늘 일정과 최근 기록을 빠르게 확인하세요.' },
    schedule: { eyebrow: 'SCHEDULE', title: '일정과 장소', text: '날짜별 일정과 장소 상세를 차례대로 확인하세요.' },
    timeline: { eyebrow: 'TIMELINE', title: '워크샵 기록', text: '장소별 에피소드와 사진을 시간순으로 모아봅니다.' },
    settings: { eyebrow: 'SETTINGS', title: '앱 설정', text: '동기화, 백업, 접속 정보를 관리합니다.' }
  };
  const DAY_LABELS = [
    { day: '1일차', date: '6/17' },
    { day: '2일차', date: '6/18' },
    { day: '3일차', date: '6/19' },
    { day: '4일차', date: '6/20' }
  ];
  const NAV_ICONS = { home: '⌂', schedule: '▦', timeline: '◷', settings: '⚙' };

  let raf = 0;
  let bottomNavBound = false;

  function smoothTop() {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, left: 0, behavior });
  }

  function ensureViewHeading() {
    const app = document.getElementById('appPanel');
    const tabs = document.getElementById('dayTabs');
    if (!app || !tabs) return null;
    let heading = document.getElementById('uxViewHeading');
    if (!heading) {
      heading = document.createElement('section');
      heading.id = 'uxViewHeading';
      heading.className = 'ux-view-heading';
      heading.setAttribute('aria-live', 'polite');
      heading.innerHTML = '<div><span class="ux-view-eyebrow"></span><h2></h2><p></p></div><button type="button" class="ux-top-button" aria-label="화면 맨 위로 이동">↑</button>';
      tabs.insertAdjacentElement('afterend', heading);
      heading.querySelector('.ux-top-button').addEventListener('click', smoothTop);
    }
    return heading;
  }

  function syncViewHeading() {
    const heading = ensureViewHeading();
    if (!heading) return;
    const view = document.body.dataset.activeView || 'home';
    const copy = VIEW_COPY[view] || VIEW_COPY.home;
    heading.dataset.view = view;
    heading.querySelector('.ux-view-eyebrow').textContent = copy.eyebrow;
    heading.querySelector('h2').textContent = copy.title;
    heading.querySelector('p').textContent = copy.text;
  }

  function decorateDayTabs() {
    const tabs = document.getElementById('dayTabs');
    if (!tabs) return;
    tabs.querySelectorAll('button').forEach((button, index) => {
      const label = DAY_LABELS[index];
      if (!label) return;
      const active = button.classList.contains('active');
      button.dataset.dayIndex = String(index + 1);
      button.setAttribute('aria-label', `${label.day} ${label.date}${active ? ', 선택됨' : ''}`);
      if (button.dataset.uxDecorated !== label.date) {
        button.innerHTML = `<strong>${label.day}</strong><small>${label.date}</small>`;
        button.dataset.uxDecorated = label.date;
      }
    });
  }

  function decorateBottomNav() {
    const nav = document.getElementById('bottomNav');
    if (!nav) return;
    nav.querySelectorAll('[data-view]').forEach((button) => {
      const view = button.dataset.view;
      const icon = button.querySelector('.nav-icon');
      if (icon && NAV_ICONS[view]) icon.textContent = NAV_ICONS[view];
      const label = button.querySelector('span:last-child')?.textContent?.trim() || '탭';
      button.setAttribute('aria-label', `${label} 화면으로 이동하고 맨 위로`);
      button.setAttribute('title', `${label} · 누르면 맨 위로 이동`);
    });
    if (!bottomNavBound) {
      bottomNavBound = true;
      nav.addEventListener('click', (event) => {
        const button = event.target.closest('[data-view]');
        if (!button) return;
        requestAnimationFrame(() => requestAnimationFrame(smoothTop));
      });
    }
  }

  function compactViewSwitch() {
    const panel = document.getElementById('viewSwitch');
    if (!panel) return;
    panel.classList.add('ux-view-switch');
    const title = panel.querySelector('h2');
    if (title) title.textContent = '화면 미리보기';
    const description = panel.querySelector('p');
    if (description) description.textContent = '관리자 · 가족 · 여자친구 화면을 확인합니다.';
  }

  function markReadableSections() {
    document.querySelectorAll('.panel').forEach((panel) => {
      if (panel.querySelector(':scope > h2, :scope > .panel-title-row, :scope > .home-topline')) panel.classList.add('ux-section-panel');
    });
    document.querySelectorAll('button, a, input, textarea, select').forEach((element) => {
      element.style.touchAction = 'manipulation';
    });
  }

  function enhance() {
    syncViewHeading();
    decorateDayTabs();
    decorateBottomNav();
    compactViewSwitch();
    markReadableSections();
  }

  function scheduleEnhance() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(enhance);
  }

  function boot() {
    if (!document.getElementById('appPanel')) return setTimeout(boot, 80);
    enhance();
    const observer = new MutationObserver(scheduleEnhance);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'data-active-view'] });
    window.__workshopUxPolish = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
