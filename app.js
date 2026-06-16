"use strict";

const DAYS = [
  { id: "0617", label: "6/17", title: "1일차 · 수요일", sub: "보안 일정" },
  { id: "0618", label: "6/18", title: "2일차 · 목요일", sub: "보안 일정" },
  { id: "0619", label: "6/19", title: "3일차 · 금요일", sub: "보안 일정" },
  { id: "0620", label: "6/20", title: "4일차 · 토요일", sub: "보안 일정" }
];

const ROLE_LABELS = { admin: "관리자 모드", girlfriend: "여자친구 모드", family: "가족 안심 모드" };
const SCHEDULE_TYPES = [
  { id: "airport", label: "공항/비행", icon: "✈️" },
  { id: "transit", label: "이동", icon: "🚆" },
  { id: "hotel", label: "숙소", icon: "🏨" },
  { id: "food", label: "식당", icon: "🍽️" },
  { id: "shop", label: "매장", icon: "🛍️" },
  { id: "meet", label: "미팅/자유", icon: "🤝" },
  { id: "place", label: "장소", icon: "📍" }
];
const PAYMENT_TYPES = [
  { id: "cash", label: "현금", icon: "💴" },
  { id: "card", label: "카드", icon: "💳" },
  { id: "company", label: "회사 지원", icon: "🏢" },
  { id: "other", label: "기타", icon: "🧾" },
  { id: "custom", label: "직접입력", icon: "✍️" }
];
const DEFAULT_STATE = { notes: {}, schedule: [], expenses: [], shoppingItems: [], shopping: {}, girlfriendRequests: [], visitDone: {}, checkins: [], familyStatus: { text: "", memo: "", updatedAt: "" } };

const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));
const storage = {
  get(key) { try { return localStorage.getItem(key) || ""; } catch { return ""; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} }
};

let supabaseClient = null;
let token = storage.get("workshopToken");
let role = storage.get("workshopRole");
let selectedDay = "0617";
let selectedItemId = "";
let state = typeof structuredClone === "function" ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
let photos = [];
let accessOverview = { codes: [], recentAccess: [] };
let busy = false;
let routeMap = null;
let routeLayer = null;

function normalizeAccessCode(code) { return String(code || "").toLocaleLowerCase("ko-KR").replace(/\s+/g, ""); }
function nowIso() { return new Date().toISOString(); }
function fmt(value) { return value ? new Date(value).toLocaleString("ko-KR") : "기록 없음"; }
function safeText(value) { return String(value || "").trim(); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function makeId(prefix = "x") { return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32); }
function getClientInfo() { return [navigator.userAgent || "unknown", navigator.platform || "", `${innerWidth}x${innerHeight}`].filter(Boolean).join(" | ").slice(0, 500); }

function hasConfig() {
  const c = window.WORKSHOP_SUPABASE;
  return Boolean(c && c.url && c.key && !c.url.includes("YOUR-PROJECT-REF") && !c.key.includes("YOUR_SUPABASE"));
}
function ensureClient() {
  if (!hasConfig()) { setMessage("Supabase 설정을 먼저 완료해주세요.", "warn"); return false; }
  if (!window.supabase?.createClient) { setMessage("Supabase 클라이언트 로드 실패. 새로고침해주세요.", "error"); return false; }
  if (!supabaseClient) supabaseClient = window.supabase.createClient(window.WORKSHOP_SUPABASE.url, window.WORKSHOP_SUPABASE.key, { auth: { persistSession: false } });
  return true;
}
async function rpc(name, args) {
  if (!ensureClient()) throw new Error("Supabase 설정이 필요합니다.");
  const { data, error } = await supabaseClient.rpc(name, args);
  if (error) throw error;
  return data;
}
function setMessage(msg, tone = "") { const el = $("#loginMessage"); if (el) { el.textContent = msg || ""; el.className = `message ${tone}`.trim(); } }
function setAccessMessage(msg, tone = "") { const el = $("#accessMessage"); if (el) { el.textContent = msg || ""; el.className = `message ${tone}`.trim(); } }
function setDataMessage(msg, tone = "") { const el = $("#dataMessage"); if (el) { el.textContent = msg || ""; el.className = `message ${tone}`.trim(); } }
function setScheduleMessage(msg, tone = "") { const el = $("#scheduleEditorMessage"); if (el) { el.textContent = msg || ""; el.className = `message ${tone}`.trim(); } }
function setBusy(next) { busy = next; ["#loginBtn", "#refreshBtn"].forEach((q) => { const b = $(q); if (b) b.disabled = next; }); }

function normalizeTextItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => typeof item === "string" ? { id: makeId("t"), text: safeText(item), done: false } : { id: safeText(item.id) || makeId("t"), text: safeText(item.text), done: Boolean(item.done), note: safeText(item.note) }).filter((item) => item.text).slice(0, 150);
}
function getScheduleType(item) {
  const requested = safeText(item?.type);
  if (SCHEDULE_TYPES.some((type) => type.id === requested)) return requested;
  const text = `${item?.title || ""} ${item?.place || ""}`.toLowerCase();
  if (/airport|공항|항공|flight|narita|incheon|terminal|t1|t2|t3/.test(text)) return "airport";
  if (/hotel|호텔|체크인|체크아웃|check.?in|check.?out/.test(text)) return "hotel";
  if (/점심|아침|식당|식사|돈카츠|lunch|breakfast|restaurant|tonkatsu|paradise|gold/.test(text)) return "food";
  if (/매장|투어|store|loft|itoya|kakimori|bungubox|kitte|문구|쇼핑|구매/.test(text)) return "shop";
  if (/이동|역|버스|게이세이|jr|station|bus|출발|도착/.test(text)) return "transit";
  if (/미팅|만남|자유|meet/.test(text)) return "meet";
  return "place";
}
function getScheduleTypeMeta(itemOrType) {
  const typeId = typeof itemOrType === "string" ? itemOrType : getScheduleType(itemOrType);
  return SCHEDULE_TYPES.find((type) => type.id === typeId) || SCHEDULE_TYPES[SCHEDULE_TYPES.length - 1];
}
function normalizeSchedule(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const lat = Number(item.lat), lng = Number(item.lng);
    return { id: safeText(item.id) || makeId("e"), day: DAYS.some((d) => d.id === item.day) ? item.day : selectedDay, type: getScheduleType(item), time: safeText(item.time), title: safeText(item.title), place: safeText(item.place), map: safeText(item.map), ...(Number.isFinite(lat) ? { lat } : {}), ...(Number.isFinite(lng) ? { lng } : {}) };
  }).filter((item) => item.day && item.time && item.title && item.place).slice(0, 150);
}
function makeExpenseId() { return makeId("x").slice(0, 24); }
function normalizeExpenses(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const amount = Number(item.amount);
    const paymentType = PAYMENT_TYPES.some((type) => type.id === item.paymentType) ? item.paymentType : "other";
    return {
      id: safeText(item.id) || makeExpenseId(),
      date: safeText(item.date).slice(0, 10),
      title: safeText(item.title).slice(0, 80),
      amount: Number.isFinite(amount) ? Math.max(0, amount) : 0,
      currency: ["JPY", "KRW", "USD"].includes(item.currency) ? item.currency : "JPY",
      paymentType,
      customTag: safeText(item.customTag).slice(0, 32),
      scheduleItemId: safeText(item.scheduleItemId).slice(0, 32),
      memo: safeText(item.memo).slice(0, 500),
      createdAt: safeText(item.createdAt) || nowIso(),
      updatedAt: safeText(item.updatedAt) || safeText(item.createdAt) || nowIso()
    };
  }).filter((item) => item.date && item.title && item.amount > 0).slice(0, 240);
}
function receiptPhotoItemId(expenseId) { return `expense:${safeText(expenseId).slice(0, 23)}`.slice(0, 32); }
function expensePhotos(expenseId) { const id = receiptPhotoItemId(expenseId); return photos.filter((p) => (p.itemId || p.item_id) === id); }
function paymentMeta(expense) {
  const meta = PAYMENT_TYPES.find((type) => type.id === expense.paymentType) || PAYMENT_TYPES.find((type) => type.id === "other");
  return expense.paymentType === "custom" && expense.customTag ? { ...meta, label: expense.customTag } : meta;
}
function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: currency || "JPY", maximumFractionDigits: currency === "USD" ? 2 : 0 }).format(Number(amount) || 0);
  } catch {
    return `${(Number(amount) || 0).toLocaleString("ko-KR")} ${currency || ""}`.trim();
  }
}
function localDateValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function scheduleDateValue(dayId) {
  const day = DAYS.find((item) => item.id === dayId);
  return day ? `2026-${day.id.slice(0, 2)}-${day.id.slice(2)}` : localDateValue();
}
function normalizeState(incoming = {}) {
  state = {
    notes: { ...(incoming.notes || {}) },
    schedule: normalizeSchedule(incoming.schedule),
    expenses: normalizeExpenses(incoming.expenses),
    shoppingItems: normalizeTextItems(incoming.shoppingItems),
    shopping: { ...(incoming.shopping || {}) },
    girlfriendRequests: normalizeTextItems(incoming.girlfriendRequests),
    visitDone: { ...(incoming.visitDone || {}) },
    checkins: Array.isArray(incoming.checkins) ? incoming.checkins : [],
    familyStatus: { ...DEFAULT_STATE.familyStatus, ...(incoming.familyStatus || {}) }
  };
}
function selectedItem() { return state.schedule.find((item) => item.id === selectedItemId) || null; }
function dayItems() { return state.schedule.filter((item) => item.day === selectedDay); }
function itemById(id) { return state.schedule.find((item) => item.id === id) || null; }
function coords(item) { const lat = Number(item?.lat), lng = Number(item?.lng); return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null; }
function mapUrl(item) { const c = coords(item); return item?.map || (c ? `https://maps.google.com/?q=${c[0]},${c[1]}` : `https://maps.google.com/?q=${encodeURIComponent(`${item?.title || ""} ${item?.place || ""}`)}`); }
function roleCanEdit() { return role === "admin"; }

async function login(event) {
  event.preventDefault();
  if (busy || !ensureClient()) return;
  const code = $("#pinInput").value.trim();
  if (!code) return setMessage("접속 코드를 입력해주세요.", "warn");
  try {
    setBusy(true); setMessage("입장 확인 중입니다...");
    const result = await rpc("workshop_login", { p_code: code, p_client_info: getClientInfo() });
    if (!result?.ok) return setMessage(result?.message || "접속 코드를 확인하지 못했습니다.", "error");
    token = result.token; role = result.role;
    storage.set("workshopToken", token); storage.set("workshopRole", role);
    $("#pinInput").value = "";
    await loadState(true);
    setMessage("");
  } catch (error) { setMessage(`접속 오류: ${error.message}`, "error"); }
  finally { setBusy(false); }
}
async function logout() {
  try { if (token && supabaseClient) await rpc("workshop_logout", { p_token: token }); } catch {}
  token = ""; role = ""; selectedItemId = ""; photos = []; accessOverview = { codes: [], recentAccess: [] };
  storage.remove("workshopToken"); storage.remove("workshopRole"); normalizeState(DEFAULT_STATE); render();
}
async function loadAdminOverview(rerender = false) {
  if (role !== "admin") return;
  try {
    const result = await rpc("workshop_get_admin_overview", { p_token: token });
    if (!result?.ok) throw new Error(result?.message || "접속 현황 로드 실패");
    accessOverview = { codes: Array.isArray(result.codes) ? result.codes : [], recentAccess: Array.isArray(result.recentAccess) ? result.recentAccess : [] };
    if (rerender) renderAccessOverview();
  } catch (error) { setAccessMessage(error.message, "error"); }
}
async function loadState(force = false) {
  if (!token || (busy && !force)) return;
  try {
    setBusy(true);
    const result = await rpc("workshop_get_state", { p_token: token });
    if (!result?.ok) { alert(result?.message || "세션이 만료되었습니다."); await logout(); return; }
    role = result.role; storage.set("workshopRole", role);
    normalizeState(result.data); photos = Array.isArray(result.photos) ? result.photos : [];
    if (selectedItemId && !itemById(selectedItemId)) selectedItemId = "";
    if (role === "admin") await loadAdminOverview(false);
    render();
  } catch (error) { alert(`데이터 불러오기 실패: ${error.message}`); }
  finally { setBusy(false); }
}
async function saveState() {
  if (role !== "admin") return;
  const payload = { notes: state.notes, schedule: state.schedule, expenses: state.expenses, shoppingItems: state.shoppingItems, shopping: state.shopping, girlfriendRequests: state.girlfriendRequests, visitDone: state.visitDone, checkins: state.checkins, familyStatus: state.familyStatus };
  const result = await rpc("workshop_save_state", { p_token: token, p_data: payload });
  if (!result?.ok) throw new Error(result?.message || "저장 실패");
}
async function withSave(message, action) { try { await action(); render(); flash(message); } catch (error) { alert(error.message); } }
function flash(message) { if (!message) return; const el = $("#sessionLabel"); const old = el.textContent; el.textContent = message; setTimeout(() => { el.textContent = ROLE_LABELS[role] || old; }, 1400); }

function render() {
  const configured = hasConfig();
  $("#setupWarning").hidden = configured;
  $("#loginPanel").hidden = Boolean(token);
  $("#appPanel").hidden = !token;
  $("#logoutBtn").hidden = !token;
  $("#sessionLabel").textContent = token ? (ROLE_LABELS[role] || "접속됨") : "접속 필요";
  if (!configured) setMessage("Supabase 설정 전에는 접속 코드를 확인할 수 없습니다.", "warn");
  if (!token) return;
  $$(".admin-only").forEach((el) => { el.hidden = role !== "admin"; });
  const gfPanel = $("#girlfriendPanel"); if (gfPanel) gfPanel.hidden = !["admin", "girlfriend"].includes(role);
  renderTabs(); renderRouteMap(); renderStatus(); renderTimeline(); renderAccessOverview(); renderSchedule(); renderScheduleEditor(); renderExpenses(); renderShopping(); renderGirlfriend(); renderDetail();
}
function renderTabs() {
  const box = $("#dayTabs"); box.replaceChildren();
  DAYS.forEach((day) => { const b = document.createElement("button"); b.type = "button"; b.textContent = day.label; b.className = day.id === selectedDay ? "active" : ""; b.onclick = () => { selectedDay = day.id; selectedItemId = ""; render(); }; box.appendChild(b); });
  const day = DAYS.find((d) => d.id === selectedDay); $("#dayTitle").textContent = day?.title || "보안 일정"; $("#daySub").textContent = day?.sub || "";
}
function renderRouteMap() {
  const items = dayItems(), points = items.map(coords).filter(Boolean);
  $("#routeSummary").textContent = items.length ? `${items.length}개 일정 · 좌표 ${points.length}개` : "아직 등록된 일정이 없습니다.";
  $("#routeMapLink").href = points.length ? `https://maps.google.com/?q=${points[0][0]},${points[0][1]}` : "https://maps.google.com/";
  const stops = $("#routeStops"); stops.replaceChildren();
  items.forEach((item, i) => {
    const meta = getScheduleTypeMeta(item);
    const b = document.createElement("button");
    b.type = "button";
    b.className = selectedItemId === item.id ? "active" : "";
    const number = document.createElement("span"); number.className = "route-stop-number"; number.textContent = String(i + 1);
    const time = document.createElement("strong"); time.textContent = item.time;
    const type = document.createElement("span"); type.className = "route-stop-type"; type.textContent = `${meta.icon} ${meta.label}`;
    const title = document.createElement("span"); title.className = "route-stop-title"; title.textContent = item.title;
    b.append(number, time, type, title);
    b.onclick = () => selectItem(item.id, true);
    stops.appendChild(b);
  });
  if (!window.L || !$("#routeMap")) return;
  if (!routeMap) { routeMap = L.map("routeMap", { scrollWheelZoom: false, zoomControl: false }); L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(routeMap); L.control.zoom({ position: "bottomright" }).addTo(routeMap); routeLayer = L.layerGroup().addTo(routeMap); }
  setTimeout(() => routeMap.invalidateSize(), 0); routeLayer.clearLayers();
  if (!points.length) { routeMap.setView([35.6812, 139.7671], 11); return; }
  if (points.length > 1) L.polyline(points, { color: "#67e8f9", opacity: 0.88, weight: 4 }).addTo(routeLayer);
  items.forEach((item, i) => { const c = coords(item); if (!c) return; const icon = L.divIcon({ className: `route-marker-icon${selectedItemId === item.id ? " active" : ""}`, html: `<span>${i + 1}</span>`, iconSize: [32, 32], iconAnchor: [16, 16] }); L.marker(c, { icon }).addTo(routeLayer).bindTooltip(`${i + 1}. ${item.time} ${item.title}`).on("click", () => selectItem(item.id, true)); });
  points.length === 1 ? routeMap.setView(points[0], 14) : routeMap.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 14 });
}
function renderStatus() {
  const s = state.familyStatus || DEFAULT_STATE.familyStatus, box = $("#familyStatusView"); box.replaceChildren();
  const strong = document.createElement("strong"); strong.textContent = s.text || "아직 공유된 상태가 없습니다.";
  const memo = document.createElement("p"); memo.textContent = s.memo || "관리자가 공유 상태를 저장하면 여기에 표시됩니다.";
  const small = document.createElement("small"); small.textContent = s.updatedAt ? fmt(s.updatedAt) : "업데이트 전";
  box.append(strong, memo, small);
  if (role === "admin") { $("#statusText").value = s.text || ""; $("#statusMemo").value = s.memo || ""; }
}
function selectItem(id, scroll = false) { selectedItemId = id; render(); if (scroll) setTimeout(() => $("#detailPanel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80); }
function renderSchedule() {
  const list = $("#scheduleList"); list.replaceChildren(); const items = dayItems();
  if (!items.length) { const e = document.createElement("div"); e.className = "empty-state"; e.innerHTML = "<strong>등록된 일정이 없습니다.</strong><p>관리자 모드에서 일정을 추가하거나 JSON을 가져오세요.</p>"; list.appendChild(e); return; }
  items.forEach((item) => {
    const typeId = getScheduleType(item);
    const meta = getScheduleTypeMeta(typeId);
    const b = document.createElement("button");
    b.type = "button";
    b.className = ["schedule-card", `type-${typeId}`, selectedItemId === item.id ? "active" : "", state.visitDone[item.id] ? "done" : ""].filter(Boolean).join(" ");
    const time = document.createElement("span"); time.className = "time"; time.textContent = item.time;
    const icon = document.createElement("span"); icon.className = "schedule-icon"; icon.setAttribute("aria-label", meta.label); icon.textContent = meta.icon;
    const body = document.createElement("span"); body.className = "schedule-body";
    const title = document.createElement("strong"); title.textContent = item.title;
    const place = document.createElement("span"); place.className = "muted"; place.textContent = item.place;
    const chip = document.createElement("span"); chip.className = `type-chip type-${typeId}`; chip.textContent = meta.label;
    body.append(title, place, chip);
    if (state.visitDone[item.id]) { const badge = document.createElement("span"); badge.className = "badge"; badge.textContent = "방문 완료"; body.appendChild(badge); }
    b.append(time, icon, body);
    b.onclick = () => selectItem(item.id, matchMedia("(max-width: 860px)").matches);
    list.appendChild(b);
  });
}
function renderScheduleEditor() {
  if (role !== "admin") return; const item = selectedItem(); const dayInput = $("#scheduleDayInput"); dayInput.replaceChildren();
  DAYS.forEach((d) => { const o = document.createElement("option"); o.value = d.id; o.textContent = `${d.label} ${d.title}`; dayInput.appendChild(o); });
  const typeInput = $("#scheduleTypeInput");
  if (typeInput) {
    typeInput.replaceChildren();
    SCHEDULE_TYPES.forEach((type) => { const o = document.createElement("option"); o.value = type.id; o.textContent = `${type.icon} ${type.label}`; typeInput.appendChild(o); });
  }
  dayInput.value = item?.day || selectedDay; if (typeInput) typeInput.value = getScheduleType(item || { type: "place" }); $("#scheduleTimeInput").value = item?.time || ""; $("#scheduleTitleInput").value = item?.title || ""; $("#schedulePlaceInput").value = item?.place || ""; $("#scheduleMapInput").value = item?.map || ""; $("#scheduleLatInput").value = Number.isFinite(Number(item?.lat)) ? String(item.lat) : ""; $("#scheduleLngInput").value = Number.isFinite(Number(item?.lng)) ? String(item.lng) : "";
  ["#scheduleSaveBtn", "#scheduleDeleteBtn", "#scheduleMoveUpBtn", "#scheduleMoveDownBtn"].forEach((q) => { const b = $(q); if (b) b.disabled = !item; });
}
function readScheduleForm(id) {
  const latText = $("#scheduleLatInput").value.trim(), lngText = $("#scheduleLngInput").value.trim(), lat = latText ? Number(latText) : null, lng = lngText ? Number(lngText) : null;
  const item = { id: id || makeId("e"), day: $("#scheduleDayInput").value, type: $("#scheduleTypeInput")?.value || "place", time: $("#scheduleTimeInput").value.trim(), title: $("#scheduleTitleInput").value.trim(), place: $("#schedulePlaceInput").value.trim(), map: $("#scheduleMapInput").value.trim() };
  if (!item.time || !item.title || !item.place) throw new Error("시간, 제목, 장소는 반드시 입력해야 합니다.");
  if (item.map && !/^https?:\/\//i.test(item.map)) throw new Error("지도 링크는 http 또는 https 주소여야 합니다.");
  if ((latText || lngText) && (!Number.isFinite(lat) || !Number.isFinite(lng))) throw new Error("위도/경도는 숫자로 입력해주세요.");
  if (Number.isFinite(lat) && Number.isFinite(lng)) { item.lat = lat; item.lng = lng; }
  return item;
}
async function saveSchedule(next, msg, selectId = selectedItemId) { state.schedule = normalizeSchedule(next); selectedItemId = selectId && state.schedule.some((i) => i.id === selectId) ? selectId : ""; await withSave(msg, () => saveState()); }
async function updateScheduleItem() { try { const item = selectedItem(); if (!item) return; const next = state.schedule.map((i) => i.id === item.id ? readScheduleForm(item.id) : i); await saveSchedule(next, "일정 수정 완료", item.id); setScheduleMessage("일정을 수정했습니다.", "success"); } catch (e) { setScheduleMessage(e.message, "error"); } }
async function addScheduleItem() { try { const item = readScheduleForm(); selectedDay = item.day; await saveSchedule([...state.schedule, item], "일정 추가 완료", item.id); setScheduleMessage("새 일정을 추가했습니다.", "success"); } catch (e) { setScheduleMessage(e.message, "error"); } }
function clearScheduleForm() { selectedItemId = ""; render(); setScheduleMessage("새 일정을 입력할 수 있습니다."); }
async function deleteScheduleItem() { const item = selectedItem(); if (!item || !confirm("선택한 일정을 삭제할까요?")) return; await saveSchedule(state.schedule.filter((i) => i.id !== item.id), "일정 삭제 완료", ""); }
async function moveScheduleItem(dir) { const item = selectedItem(); if (!item) return; const idxs = state.schedule.map((i, idx) => i.day === item.day ? idx : -1).filter((v) => v >= 0); const pos = idxs.findIndex((idx) => state.schedule[idx].id === item.id), nextPos = pos + dir; if (nextPos < 0 || nextPos >= idxs.length) return setScheduleMessage("더 이동할 수 없습니다.", "warn"); const a = idxs[pos], b = idxs[nextPos]; [state.schedule[a], state.schedule[b]] = [state.schedule[b], state.schedule[a]]; await saveSchedule(state.schedule, "순서 변경 완료", item.id); }

function renderTimeline() {
  const box = $("#timelineList"); if (!box) return; box.replaceChildren(); const items = [];
  const st = state.familyStatus || {}; if (st.updatedAt && (st.text || st.memo)) items.push({ type: "상태", at: st.updatedAt, title: st.text || "공유 상태", text: st.memo });
  state.checkins.forEach((c) => { const item = itemById(c.itemId); items.push({ type: "체크인", at: c.createdAt, title: `${c.title || item?.title || "위치"} 체크인`, text: c.place || item?.place || "", map: Number.isFinite(Number(c.lat)) ? `https://maps.google.com/?q=${c.lat},${c.lng}` : "" }); });
  photos.forEach((p) => { const item = itemById(p.itemId || p.item_id); items.push({ type: "사진", at: p.createdAt || p.created_at, title: item?.title ? `${item.title} 사진` : "사진 업로드", text: item?.place || p.fileName || p.file_name || "", image: p.dataUrl || p.data_url }); });
  if (role === "admin") Object.entries(state.notes).forEach(([id, note]) => { if (safeText(note)) { const item = itemById(id); items.push({ type: "비공개 메모", at: nowIso(), title: item?.title ? `${item.title} 메모` : "관리자 메모", text: safeText(note), private: true }); } });
  items.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  if (!items.length) { const e = document.createElement("div"); e.className = "empty-state"; e.innerHTML = "<strong>아직 타임라인 기록이 없습니다.</strong><p>사진 업로드, 메모 저장, 위치 체크인을 하면 여기에 모입니다.</p>"; box.appendChild(e); return; }
  items.slice(0, 40).forEach((it) => { const c = document.createElement("article"); c.className = `timeline-card ${it.private ? "private" : ""}`; c.innerHTML = `<div class="timeline-meta"><span>${it.type}</span><small>${fmt(it.at)}</small></div><h3>${it.title || "기록"}</h3>${it.text ? `<p>${it.text.length > 220 ? `${it.text.slice(0, 220)}…` : it.text}</p>` : ""}`; if (it.image) { const img = document.createElement("img"); img.src = it.image; img.alt = it.title || "사진"; img.loading = "lazy"; c.appendChild(img); } if (it.map) { const a = document.createElement("a"); a.className = "ghost small"; a.href = it.map; a.target = "_blank"; a.rel = "noreferrer"; a.textContent = "지도 열기"; c.appendChild(a); } box.appendChild(c); });
}
function renderAccessOverview() {
  if (role !== "admin") return; const codeBox = $("#accessOverview"), logBox = $("#accessLogList");
  if (codeBox) { codeBox.replaceChildren(); const codes = accessOverview.codes || []; if (!codes.length) codeBox.innerHTML = '<p class="muted">접속 코드 정보를 불러오지 못했습니다.</p>'; codes.forEach((x) => { const row = document.createElement("div"); row.className = "access-row"; row.innerHTML = `<strong>${ROLE_LABELS[x.role] || x.role}</strong><code>${x.displayCode || "표시 코드 없음"}</code><small>변경: ${fmt(x.updatedAt)}</small>`; codeBox.appendChild(row); }); }
  if (logBox) { logBox.replaceChildren(); const logs = accessOverview.recentAccess || []; if (!logs.length) logBox.innerHTML = '<p class="muted">아직 접속 기록이 없습니다.</p>'; logs.slice(0, 12).forEach((x) => { const row = document.createElement("div"); row.className = "access-log-row"; row.innerHTML = `<strong>${ROLE_LABELS[x.role] || x.role}</strong><span>${fmt(x.createdAt)}</span><small>${x.clientInfo || "기기 정보 없음"}</small>`; logBox.appendChild(row); }); }
}
async function updateAccessCode(targetRole) {
  const prefix = targetRole === "girlfriend" ? "girlfriend" : targetRole === "family" ? "family" : "admin";
  const a = $(`#${prefix}PinInput`).value.trim(), b = $(`#${prefix}PinConfirm`).value.trim();
  if (normalizeAccessCode(a).length < 4 || a.length > 64) return setAccessMessage("접속 코드는 공백 제외 4자 이상, 전체 64자 이하로 입력해주세요.", "error");
  if (normalizeAccessCode(a) !== normalizeAccessCode(b)) return setAccessMessage("확인 값이 다릅니다. 대소문자와 공백은 무시됩니다.", "error");
  try { const r = await rpc("workshop_update_code", { p_token: token, p_role: targetRole, p_new_code: a }); if (!r?.ok) throw new Error(r?.message || "변경 실패"); $(`#${prefix}PinInput`).value = ""; $(`#${prefix}PinConfirm`).value = ""; setAccessMessage(`${ROLE_LABELS[targetRole]} 접속 코드를 변경했습니다.`, "success"); await loadAdminOverview(true); if (targetRole === "admin") setTimeout(logout, 900); } catch (e) { setAccessMessage(e.message, "error"); }
}

function renderShopping() { renderList("shopping", state.shoppingItems, $("#shoppingList"), role === "admin"); }
function renderGirlfriend() { renderList("girlfriend", state.girlfriendRequests, $("#girlfriendList"), role === "admin"); }
function renderList(kind, items, box, editable) {
  if (!box) return; box.replaceChildren(); if (!items.length) { box.innerHTML = `<p class="muted">아직 등록된 항목이 없습니다.</p>`; return; }
  items.forEach((item) => { const row = document.createElement("label"); row.className = `shopping-item ${kind === "girlfriend" ? "request-item" : ""}`; const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = Boolean(item.done); cb.disabled = !editable; cb.onchange = async () => { item.done = cb.checked; await withSave("목록 저장", () => saveState()); }; const text = document.createElement("span"); text.textContent = item.text; row.append(cb, text); if (editable) { const del = document.createElement("button"); del.type = "button"; del.className = "ghost danger mini-remove"; del.textContent = "삭제"; del.onclick = async (e) => { e.preventDefault(); const arr = kind === "girlfriend" ? state.girlfriendRequests : state.shoppingItems; const next = arr.filter((x) => x.id !== item.id); kind === "girlfriend" ? state.girlfriendRequests = next : state.shoppingItems = next; await withSave("항목 삭제", () => saveState()); }; row.appendChild(del); } box.appendChild(row); });
}
async function addTextItem(kind, inputQ) { const input = $(inputQ), text = input.value.trim(); if (!text) return; (kind === "girlfriend" ? state.girlfriendRequests : state.shoppingItems).push({ id: makeId(kind === "girlfriend" ? "g" : "s"), text, done: false }); input.value = ""; await withSave("항목 추가", () => saveState()); }

function setExpenseMessage(msg, tone = "") { const el = $("#expenseMessage"); if (el) { el.textContent = msg || ""; el.className = `message ${tone}`.trim(); } }
function scheduleLabel(item) { const day = DAYS.find((d) => d.id === item?.day); return item ? `${day?.label || ""} ${item.time} · ${item.title}`.trim() : ""; }
function renderExpenseScheduleOptions(value = "") {
  const input = $("#expenseScheduleInput");
  if (!input) return;
  const current = arguments.length ? value : input.value;
  input.replaceChildren();
  const empty = document.createElement("option"); empty.value = ""; empty.textContent = "관련 일정 없음"; input.appendChild(empty);
  state.schedule.forEach((item) => { const option = document.createElement("option"); option.value = item.id; option.textContent = scheduleLabel(item); input.appendChild(option); });
  input.value = Array.from(input.options).some((option) => option.value === current) ? current : "";
}
function updateExpenseCustomVisibility() {
  const input = $("#expensePaymentInput"), label = $("#expenseCustomLabel");
  if (!input || !label) return;
  const custom = input.value === "custom";
  label.hidden = !custom;
  if (!custom) $("#expenseCustomInput").value = "";
}
function renderExpenses() {
  if (role !== "admin") return;
  const dateInput = $("#expenseDateInput"); if (dateInput && !dateInput.value) dateInput.value = localDateValue();
  renderExpenseScheduleOptions($("#expenseScheduleInput")?.value || "");
  updateExpenseCustomVisibility();
  state.expenses = normalizeExpenses(state.expenses);
  const totals = state.expenses.reduce((acc, item) => { acc[item.currency] = (acc[item.currency] || 0) + item.amount; return acc; }, {});
  const totalsText = Object.entries(totals).map(([currency, amount]) => formatMoney(amount, currency)).join(" · ");
  const summary = $("#expenseSummaryText"); if (summary) summary.textContent = state.expenses.length ? `${state.expenses.length}건 · ${totalsText}` : "식사, 구매, 회사 지원 기록";
  const totalsBox = $("#expenseTotals"); if (totalsBox) { totalsBox.replaceChildren(); if (!state.expenses.length) totalsBox.innerHTML = '<p class="muted">아직 저장된 지출이 없습니다.</p>'; else Object.entries(totals).forEach(([currency, amount]) => { const chip = document.createElement("span"); chip.className = "expense-total-chip"; chip.textContent = formatMoney(amount, currency); totalsBox.appendChild(chip); }); }
  const list = $("#expenseList"); if (!list) return; list.replaceChildren();
  state.expenses.slice().sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`)).forEach((expense) => {
    const pay = paymentMeta(expense), related = itemById(expense.scheduleItemId), receipts = expensePhotos(expense.id);
    const card = document.createElement("article"); card.className = "expense-card";
    const head = document.createElement("div"); head.className = "expense-head";
    const info = document.createElement("div"); info.className = "expense-info";
    const title = document.createElement("strong"); title.textContent = expense.title;
    const meta = document.createElement("p"); meta.className = "muted"; meta.textContent = `${expense.date} · ${pay.icon} ${pay.label}`;
    const amount = document.createElement("span"); amount.className = "expense-amount"; amount.textContent = formatMoney(expense.amount, expense.currency);
    info.append(title, meta); head.append(info, amount); card.appendChild(head);
    if (related) { const link = document.createElement("button"); link.type = "button"; link.className = "ghost small expense-related"; link.textContent = scheduleLabel(related); link.onclick = () => { selectedDay = related.day; selectItem(related.id, true); }; card.appendChild(link); }
    if (expense.memo) { const memo = document.createElement("p"); memo.className = "expense-memo"; memo.textContent = expense.memo; card.appendChild(memo); }
    if (receipts.length) { const grid = document.createElement("div"); grid.className = "receipt-grid"; receipts.forEach((p) => { const receipt = document.createElement("div"); receipt.className = "receipt-card"; const img = document.createElement("img"); img.src = p.dataUrl || p.data_url; img.alt = p.fileName || p.file_name || "영수증 사진"; img.loading = "lazy"; const del = document.createElement("button"); del.type = "button"; del.className = "ghost small"; del.textContent = "삭제"; del.onclick = () => deletePhoto(p.id); receipt.append(img, del); grid.appendChild(receipt); }); card.appendChild(grid); }
    const actions = document.createElement("div"); actions.className = "button-row expense-actions"; const del = document.createElement("button"); del.type = "button"; del.className = "ghost danger small"; del.textContent = "지출 삭제"; del.onclick = () => deleteExpense(expense.id); actions.appendChild(del); card.appendChild(actions);
    list.appendChild(card);
  });
}
function readExpenseForm() {
  const paymentType = $("#expensePaymentInput").value, customTag = $("#expenseCustomInput").value.trim(), amount = Number($("#expenseAmountInput").value), title = $("#expenseTitleInput").value.trim();
  if (!title) throw new Error("지출 제목을 입력해주세요.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("금액을 0보다 큰 숫자로 입력해주세요.");
  if (paymentType === "custom" && !customTag) throw new Error("직접입력 태그 이름을 적어주세요.");
  return normalizeExpenses([{ id: makeExpenseId(), date: $("#expenseDateInput").value || localDateValue(), title, amount, currency: $("#expenseCurrencyInput").value, paymentType, customTag, scheduleItemId: $("#expenseScheduleInput").value, memo: $("#expenseMemoInput").value.trim(), createdAt: nowIso(), updatedAt: nowIso() }])[0];
}
function clearExpenseForm(keepDate = true) {
  const currentDate = $("#expenseDateInput")?.value || localDateValue();
  ["#expenseTitleInput", "#expenseAmountInput", "#expenseMemoInput", "#expenseCustomInput"].forEach((q) => { const el = $(q); if (el) el.value = ""; });
  $("#expenseReceiptInput").value = ""; $("#expensePaymentInput").value = "cash"; $("#expenseCurrencyInput").value = "JPY"; $("#expenseDateInput").value = keepDate ? currentDate : localDateValue();
  renderExpenseScheduleOptions(""); updateExpenseCustomVisibility();
}
async function addExpense(event) {
  event.preventDefault();
  if (role !== "admin") return;
  const before = state.expenses.slice(); let saved = false;
  try {
    setBusy(true);
    const expense = readExpenseForm(); state.expenses = normalizeExpenses([expense, ...state.expenses]); await saveState(); saved = true;
    const files = Array.from($("#expenseReceiptInput").files || []);
    for (const file of files) {
      const dataUrl = await resizeImage(file);
      const r = await rpc("workshop_add_photo", { p_token: token, p_item_id: receiptPhotoItemId(expense.id), p_file_name: file.name, p_mime_type: "image/jpeg", p_data_url: dataUrl, p_shared_with_family: false, p_shared_with_girlfriend: false });
      if (!r?.ok) throw new Error(r?.message || "영수증 사진 업로드 실패");
      photos.push(r.photo);
    }
    clearExpenseForm(); render(); setExpenseMessage(files.length ? "지출과 영수증 사진을 저장했습니다." : "지출을 저장했습니다.", "success");
  } catch (e) {
    if (!saved) { state.expenses = before; renderExpenses(); setExpenseMessage(e.message, "error"); }
    else { render(); setExpenseMessage(`지출은 저장됐지만 영수증 업로드 중 문제가 생겼습니다: ${e.message}`, "warn"); }
  } finally { setBusy(false); }
}
async function deleteExpense(id) {
  if (role !== "admin" || !id || !confirm("이 지출 기록을 삭제할까요?")) return;
  const before = state.expenses.slice();
  try {
    setBusy(true);
    for (const p of expensePhotos(id)) { const r = await rpc("workshop_delete_photo", { p_token: token, p_photo_id: p.id }); if (!r?.ok) throw new Error(r?.message || "영수증 사진 삭제 실패"); photos = photos.filter((x) => x.id !== p.id); }
    state.expenses = state.expenses.filter((item) => item.id !== id); await saveState(); render(); setExpenseMessage("지출 기록을 삭제했습니다.", "success");
  } catch (e) { state.expenses = before; renderExpenses(); setExpenseMessage(e.message, "error"); }
  finally { setBusy(false); }
}
function openExpenseForItem(item) {
  if (role !== "admin" || !item) return;
  $("#expenseDateInput").value = scheduleDateValue(item.day);
  if (!$("#expenseTitleInput").value.trim()) $("#expenseTitleInput").value = item.title;
  renderExpenseScheduleOptions(item.id); $("#expenseScheduleInput").value = item.id;
  $("#expensePanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderDetail() {
  const wrap = $("#detailContent"), empty = $("#emptyDetailText"), item = selectedItem(); wrap.replaceChildren(); if (!item) { empty.hidden = false; return; } empty.hidden = true;
  const typeId = getScheduleType(item), meta = getScheduleTypeMeta(typeId);
  const head = document.createElement("div"); head.className = "detail-head";
  const detailMeta = document.createElement("div"); detailMeta.className = "detail-meta";
  const time = document.createElement("p"); time.className = "time"; time.textContent = item.time;
  const type = document.createElement("span"); type.className = `type-chip type-${typeId}`; type.textContent = `${meta.icon} ${meta.label}`;
  const title = document.createElement("h3"); title.textContent = item.title;
  const place = document.createElement("p"); place.className = "muted"; place.textContent = item.place;
  detailMeta.append(time, type); head.append(detailMeta, title, place);
  const buttons = document.createElement("div"); buttons.className = "button-row"; buttons.innerHTML = `<a href="${mapUrl(item)}" target="_blank" rel="noreferrer">구글맵</a><button class="ghost" type="button">장소 복사</button>`; buttons.querySelector("button").onclick = () => navigator.clipboard?.writeText(`${item.title} / ${item.place}`);
  wrap.append(head, buttons); renderCheckins(wrap, item); renderPhotos(wrap, item); if (role === "admin") renderAdminTools(wrap, item);
}
function renderCheckins(wrap, item) { const sec = document.createElement("section"); sec.className = "mini-section"; sec.innerHTML = "<h4>체크인 기록</h4>"; const rows = state.checkins.filter((c) => c.itemId === item.id).slice().reverse(); if (!rows.length) sec.innerHTML += '<p class="muted">아직 체크인 기록이 없습니다.</p>'; rows.forEach((c) => { const a = document.createElement("a"); a.className = "checkin-row"; a.href = `https://maps.google.com/?q=${c.lat},${c.lng}`; a.target = "_blank"; a.rel = "noreferrer"; a.textContent = `${fmt(c.createdAt)} · 정확도 ${Math.round(c.accuracy || 0)}m`; sec.appendChild(a); }); wrap.appendChild(sec); }
function renderPhotos(wrap, item) { const sec = document.createElement("section"); sec.className = "mini-section"; sec.innerHTML = `<h4>${role === "admin" ? "사진" : "공유 사진"}</h4>`; const rows = photos.filter((p) => (p.itemId || p.item_id) === item.id); if (!rows.length) sec.innerHTML += `<p class="muted">${role === "admin" ? "아직 업로드한 사진이 없습니다." : "공유된 사진이 없습니다."}</p>`; else { const grid = document.createElement("div"); grid.className = "photos"; rows.forEach((p) => { const card = document.createElement("div"); card.className = "photo-card"; const img = document.createElement("img"); img.src = p.dataUrl || p.data_url; img.alt = p.fileName || p.file_name || "워크샵 사진"; img.loading = "lazy"; card.appendChild(img); if (role === "admin") { const meta = document.createElement("small"); meta.textContent = `${p.sharedWithFamily || p.shared_with_family ? "가족공유" : "가족숨김"} · ${p.sharedWithGirlfriend || p.shared_with_girlfriend ? "여친공유" : "여친숨김"}`; const del = document.createElement("button"); del.className = "ghost"; del.type = "button"; del.textContent = "삭제"; del.onclick = () => deletePhoto(p.id); card.append(meta, del); } grid.appendChild(card); }); sec.appendChild(grid); } wrap.appendChild(sec); }
function renderAdminTools(wrap, item) { const sec = document.createElement("section"); sec.className = "admin-tools stacked-form"; sec.innerHTML = `<label for="noteInput">관리자 메모</label><textarea id="noteInput" placeholder="회사 업무 메모, 배운 점, 구매/상담 내용 등 비공개 내용을 적어도 됩니다.">${state.notes[item.id] || ""}</textarea><div class="button-row"><button id="saveNoteBtn" type="button">메모 저장</button><button id="checkinBtn" class="ghost" type="button">현재 위치 체크인</button><button id="expenseForItemBtn" class="ghost" type="button">이 장소 지출 기록</button></div><label>사진 업로드</label><div class="share-options"><label><input id="shareFamilyInput" type="checkbox" checked /> 가족에게 공유</label><label><input id="shareGirlfriendInput" type="checkbox" checked /> 여자친구에게 공유</label></div><input id="photoInput" type="file" accept="image/*" multiple />`; wrap.appendChild(sec); $("#saveNoteBtn").onclick = async () => { state.notes[item.id] = $("#noteInput").value; state.visitDone[item.id] = true; await withSave("메모 저장 완료", () => saveState()); }; $("#checkinBtn").onclick = () => checkin(item); $("#expenseForItemBtn").onclick = () => openExpenseForItem(item); $("#photoInput").onchange = (e) => addPhotos(item, e.target.files); }

function resizeImage(file) { return new Promise((resolve, reject) => { const img = new Image(), reader = new FileReader(); reader.onload = () => { img.onload = () => { const max = 1280; let w = img.width, h = img.height; if (w > h && w > max) { h = Math.round(h * max / w); w = max; } else if (h >= w && h > max) { w = Math.round(w * max / h); h = max; } const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h; canvas.getContext("2d").drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL("image/jpeg", 0.74)); }; img.onerror = reject; img.src = reader.result; }; reader.onerror = reject; reader.readAsDataURL(file); }); }
async function addPhotos(item, files) { if (!files?.length) return; const sf = Boolean($("#shareFamilyInput")?.checked), sg = Boolean($("#shareGirlfriendInput")?.checked); try { for (const file of files) { const dataUrl = await resizeImage(file); const r = await rpc("workshop_add_photo", { p_token: token, p_item_id: item.id, p_file_name: file.name, p_mime_type: "image/jpeg", p_data_url: dataUrl, p_shared_with_family: sf, p_shared_with_girlfriend: sg }); if (!r?.ok) throw new Error(r?.message || "사진 업로드 실패"); photos.push(r.photo); } render(); } catch (e) { alert(e.message); } }
async function deletePhoto(id) { if (!id || !confirm("이 사진을 삭제할까요?")) return; try { const r = await rpc("workshop_delete_photo", { p_token: token, p_photo_id: id }); if (!r?.ok) throw new Error(r?.message || "사진 삭제 실패"); photos = photos.filter((p) => p.id !== id); render(); } catch (e) { alert(e.message); } }
function checkin(item) { if (!navigator.geolocation) return alert("이 브라우저는 위치 체크인을 지원하지 않습니다."); navigator.geolocation.getCurrentPosition(async (pos) => { const c = { itemId: item.id, title: item.title, place: item.place, lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, createdAt: nowIso() }; state.checkins.push(c); state.visitDone[item.id] = true; state.familyStatus = { text: `${item.title} 체크인`, memo: item.place, updatedAt: c.createdAt }; await withSave("체크인 저장 완료", () => saveState()); }, (e) => alert(`위치 저장 실패: ${e.message}`), { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }); }

function downloadFile(name, content, type = "application/json") { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
function downloadJson() { downloadFile(`japan-workshop-backup-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify({ exportedAt: nowIso(), role, state: clone(state), photos }, null, 2)); }
function downloadDayTxt() { const lines = [`${DAYS.find((d) => d.id === selectedDay)?.label || selectedDay}`, "", "[일정]"]; dayItems().forEach((i) => { lines.push(`- ${i.time} ${i.title} / ${i.place}`); if (state.notes[i.id]) lines.push(`  메모: ${state.notes[i.id].replace(/\n/g, " / ")}`); }); lines.push("", "[체크인]"); state.checkins.filter((c) => itemById(c.itemId)?.day === selectedDay).forEach((c) => lines.push(`- ${fmt(c.createdAt)} ${c.title} ${c.lat},${c.lng}`)); downloadFile(`japan-workshop-${selectedDay}.txt`, lines.join("\n"), "text/plain;charset=utf-8"); }
async function importScheduleFile(file) { if (!file || role !== "admin") return; try { const parsed = JSON.parse(await file.text()); const items = Array.isArray(parsed) ? parsed : parsed.schedule; if (!Array.isArray(items)) throw new Error("JSON 안에 schedule 배열이 필요합니다."); state.schedule = normalizeSchedule(items); selectedItemId = ""; await withSave("일정 가져오기 완료", () => saveState()); setDataMessage(`${state.schedule.length}개 일정을 가져왔습니다.`, "success"); } catch (e) { setDataMessage(e.message, "error"); } finally { $("#importScheduleInput").value = ""; } }

function bind() {
  $("#loginForm").onsubmit = login; $("#logoutBtn").onclick = logout; $("#refreshBtn").onclick = () => loadState(true);
  $("#saveStatusBtn").onclick = async () => { state.familyStatus = { text: $("#statusText").value.trim(), memo: $("#statusMemo").value.trim(), updatedAt: nowIso() }; await withSave("상태 저장 완료", () => saveState()); };
  $("#adminPinForm").onsubmit = (e) => { e.preventDefault(); updateAccessCode("admin"); };
  $("#girlfriendPinForm").onsubmit = (e) => { e.preventDefault(); updateAccessCode("girlfriend"); };
  $("#familyPinForm").onsubmit = (e) => { e.preventDefault(); updateAccessCode("family"); };
  $("#refreshAccessBtn").onclick = () => loadAdminOverview(true);
  $("#scheduleEditorForm").onsubmit = (e) => e.preventDefault(); $("#scheduleSaveBtn").onclick = updateScheduleItem; $("#scheduleAddBtn").onclick = addScheduleItem; $("#scheduleNewBtn").onclick = clearScheduleForm; $("#scheduleMoveUpBtn").onclick = () => moveScheduleItem(-1); $("#scheduleMoveDownBtn").onclick = () => moveScheduleItem(1); $("#scheduleDeleteBtn").onclick = deleteScheduleItem;
  $("#downloadJsonBtn").onclick = downloadJson; $("#downloadDayTxtBtn").onclick = downloadDayTxt; $("#importScheduleInput").onchange = (e) => importScheduleFile(e.target.files?.[0]);
  $("#shoppingAddForm").onsubmit = async (e) => { e.preventDefault(); await addTextItem("shopping", "#shoppingAddInput"); };
  $("#girlfriendAddForm").onsubmit = async (e) => { e.preventDefault(); await addTextItem("girlfriend", "#girlfriendAddInput"); };
  $("#expenseForm").onsubmit = addExpense;
  $("#expenseClearBtn").onclick = () => { clearExpenseForm(false); setExpenseMessage("입력 내용을 비웠습니다."); };
  $("#expensePaymentInput").onchange = updateExpenseCustomVisibility;
}

bind(); document.documentElement.dataset.workshopAppReady = "true";
if (hasConfig() && ensureClient() && token) loadState(true); else render();
