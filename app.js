"use strict";

const DAYS = [
  { id: "0617", label: "6/17", title: "1일차 · 수요일", sub: "인천 → 나리타 → 시오도메 → 신주쿠" },
  { id: "0618", label: "6/18", title: "2일차 · 목요일", sub: "구라마에 · 진보초 · 긴자" },
  { id: "0619", label: "6/19", title: "3일차 · 금요일", sub: "오모테산도 · 시부야 · 지인 만남" },
  { id: "0620", label: "6/20", title: "4일차 · 토요일", sub: "체크아웃 · 마루노우치 · 나리타 → 인천" }
];

const SCHEDULE = [
  { id: "a1", day: "0617", time: "07:20", title: "인천공항 T1 집합", place: "인천국제공항 제1터미널", map: "https://maps.google.com/?q=Incheon+Airport+Terminal+1" },
  { id: "a2", day: "0617", time: "09:45", title: "제주항공 7C1175 출발", place: "인천 → 나리타", map: "https://maps.google.com/?q=Incheon+Airport+Terminal+1" },
  { id: "a3", day: "0617", time: "12:15", title: "나리타공항 T3 도착", place: "Narita Airport Terminal 3", map: "https://maps.google.com/?q=Narita+Airport+Terminal+3" },
  { id: "a4", day: "0617", time: "13:00~", title: "게이세이 나리타 스카이액세스 탑승", place: "나리타공항 게이세이선", map: "https://maps.google.com/?q=Narita+Airport+Keisei" },
  { id: "a5", day: "0617", time: "14:00~", title: "신바시역 하차", place: "Shimbashi Station", map: "https://maps.google.com/?q=Shimbashi+Station" },
  { id: "a6", day: "0617", time: "15:00", title: "호텔 체크인", place: "Royal Park Hotel Iconic Tokyo Shiodome", map: "https://maps.google.com/?q=Royal+Park+Hotel+Iconic+Tokyo+Shiodome" },
  { id: "a7", day: "0617", time: "16:00", title: "신주쿠 이동", place: "Shinjuku", map: "https://maps.google.com/?q=Shinjuku+Tokyo" },
  { id: "a8", day: "0617", time: "16:00~18:30", title: "문구 매장 투어", place: "Kingdom Note / Okadaya / Itoya Shinjuku", map: "https://maps.google.com/?q=Kingdom+Note+Shinjuku" },
  { id: "a9", day: "0617", time: "19:30", title: "오사카야 GOLD", place: "Osakaya GOLD", map: "https://maps.google.com/?q=Osakaya+GOLD+Tokyo" },
  { id: "b1", day: "0618", time: "09:00", title: "아침 선택식", place: "시오도메 호텔 근처", map: "https://maps.google.com/?q=Shiodome+breakfast" },
  { id: "b2", day: "0618", time: "11:00", title: "카키모리 매장 방문", place: "Kakimori Kuramae", map: "https://maps.google.com/?q=Kakimori+Kuramae" },
  { id: "b3", day: "0618", time: "13:00", title: "점심", place: "Fukuyoshi Asakusa Kuramae", map: "https://maps.google.com/?q=Fukuyoshi+Asakusa+Kuramae" },
  { id: "b4", day: "0618", time: "15:00", title: "분구박스 매장 방문", place: "Bungubox Jimbocho", map: "https://maps.google.com/?q=Bungubox+Jimbocho" },
  { id: "b5", day: "0618", time: "16:00", title: "긴자 이동", place: "Ginza", map: "https://maps.google.com/?q=Ginza+Tokyo" },
  { id: "b6", day: "0618", time: "16:00~19:00", title: "긴자 문구 투어", place: "Ginza Itoya / Kyukyodo / 주변 매장", map: "https://maps.google.com/?q=Ginza+Itoya" },
  { id: "b7", day: "0618", time: "20:00", title: "긴자 돈카츠 사이토", place: "Ginza Tonkatsu Saito", map: "https://maps.google.com/?q=Ginza+Tonkatsu+Saito" },
  { id: "c1", day: "0619", time: "08:30", title: "아침 선택식", place: "시오도메 호텔 근처", map: "https://maps.google.com/?q=Shiodome+breakfast" },
  { id: "c2", day: "0619", time: "09:30", title: "오모테산도 이동", place: "Omotesando", map: "https://maps.google.com/?q=Omotesando+Tokyo" },
  { id: "c3", day: "0619", time: "10:00", title: "쇼사이칸 매장 방문", place: "Shosaikan Omotesando", map: "https://maps.google.com/?q=Shosaikan+Omotesando" },
  { id: "c4", day: "0619", time: "11:00", title: "하이타이드 스토어", place: "HIGHTIDE STORE MIYASHITA PARK", map: "https://maps.google.com/?q=HIGHTIDE+STORE+MIYASHITA+PARK" },
  { id: "c5", day: "0619", time: "12:30", title: "모모 파라다이스", place: "Mo-Mo-Paradise Shibuya Koen-dori", map: "https://maps.google.com/?q=Mo-Mo-Paradise+Shibuya+Koen-dori" },
  { id: "c6", day: "0619", time: "14:00", title: "시부야 로프트", place: "Shibuya Loft", map: "https://maps.google.com/?q=Shibuya+Loft" },
  { id: "c7", day: "0619", time: "16:00", title: "시부야 자유 일정 / 지인 만남", place: "Shibuya", map: "https://maps.google.com/?q=Shibuya+Tokyo" },
  { id: "d1", day: "0620", time: "09:00", title: "호텔 체크아웃 및 아침", place: "Royal Park Hotel Iconic Tokyo Shiodome", map: "https://maps.google.com/?q=Royal+Park+Hotel+Iconic+Tokyo+Shiodome" },
  { id: "d2", day: "0620", time: "11:00", title: "KITTE 마루노우치", place: "KITTE Marunouchi", map: "https://maps.google.com/?q=KITTE+Marunouchi" },
  { id: "d3", day: "0620", time: "13:00", title: "도쿄역 근처 점심", place: "Tokyo Station / Marunouchi", map: "https://maps.google.com/?q=Tokyo+Station+Marunouchi+lunch" },
  { id: "d4", day: "0620", time: "14:20", title: "JR 고속버스 나리타행 탑승", place: "Tokyo Station Yaesu South Exit", map: "https://maps.google.com/?q=Tokyo+Station+Yaesu+South+Exit+Bus" },
  { id: "d5", day: "0620", time: "15:30", title: "나리타공항 T2 도착", place: "Narita Airport Terminal 2", map: "https://maps.google.com/?q=Narita+Airport+Terminal+2" },
  { id: "d6", day: "0620", time: "17:40", title: "에어프레미아 YP736 출발", place: "나리타 → 인천", map: "https://maps.google.com/?q=Narita+Airport+Terminal+2" },
  { id: "d7", day: "0620", time: "20:25", title: "인천공항 T1 도착", place: "Incheon Airport Terminal 1", map: "https://maps.google.com/?q=Incheon+Airport+Terminal+1" }
];

const SHOPPING = [
  "프레피 만년필",
  "고양이 모양 잉크",
  "고양이 모양 문구",
  "파이롯트/플래티넘 관련 제품",
  "일본 한정 몰스킨",
  "마스킹테이프",
  "스탬프 관련 물건",
  "치이카와 관련 물건",
  "가족 선물"
];

const DEFAULT_STATE = {
  notes: {},
  shopping: {},
  visitDone: {},
  checkins: [],
  familyStatus: { text: "", memo: "", updatedAt: "" }
};

let supabaseClient = null;
const storage = {
  get(key) {
    try {
      return window.localStorage?.getItem(key) || "";
    } catch (_error) {
      return "";
    }
  },
  set(key, value) {
    try {
      window.localStorage?.setItem(key, value);
    } catch (_error) {
      // The app still works for the current tab if browser storage is blocked.
    }
  },
  remove(key) {
    try {
      window.localStorage?.removeItem(key);
    } catch (_error) {
      // Ignore storage cleanup failures in restricted browser modes.
    }
  }
};
let token = storage.get("workshopToken");
let role = storage.get("workshopRole");
let selectedDay = "0617";
let selectedItem = null;
let appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
let photos = [];
let isBusy = false;

const $ = (selector) => document.querySelector(selector);

function hasConfig() {
  const config = window.WORKSHOP_SUPABASE;
  return Boolean(
    config &&
      config.url &&
      config.key &&
      !config.url.includes("YOUR-PROJECT-REF") &&
      !config.key.includes("YOUR_SUPABASE")
  );
}

function ensureClient() {
  if (!hasConfig()) {
    setMessage("Supabase 설정을 먼저 완료해주세요.");
    return false;
  }
  if (!window.supabase?.createClient) {
    setMessage("Supabase 클라이언트 스크립트를 불러오지 못했습니다. 네트워크를 확인한 뒤 새로고침해주세요.", "error");
    return false;
  }
  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(
      window.WORKSHOP_SUPABASE.url,
      window.WORKSHOP_SUPABASE.key,
      { auth: { persistSession: false } }
    );
  }
  return true;
}

function normalizeState(nextState) {
  const incoming = nextState || {};
  appState = {
    notes: { ...DEFAULT_STATE.notes, ...(incoming.notes || {}) },
    shopping: { ...DEFAULT_STATE.shopping, ...(incoming.shopping || {}) },
    visitDone: { ...DEFAULT_STATE.visitDone, ...(incoming.visitDone || {}) },
    checkins: Array.isArray(incoming.checkins) ? incoming.checkins : [],
    familyStatus: { ...DEFAULT_STATE.familyStatus, ...(incoming.familyStatus || {}) }
  };
}

function normalizePhotos(nextPhotos) {
  photos = Array.isArray(nextPhotos) ? nextPhotos : [];
}

function setMessage(message, tone = "") {
  const el = $("#loginMessage");
  el.textContent = message || "";
  el.className = `message ${tone}`.trim();
}

function setBusy(nextBusy) {
  isBusy = nextBusy;
  $("#loginBtn").disabled = nextBusy;
  $("#refreshBtn").disabled = nextBusy;
}

async function rpc(name, args) {
  if (!ensureClient()) throw new Error("Supabase 설정이 필요합니다.");
  const { data, error } = await supabaseClient.rpc(name, args);
  if (error) throw error;
  return data;
}

async function login(event) {
  event.preventDefault();
  if (isBusy || !ensureClient()) return;

  const pin = $("#pinInput").value.trim();
  if (!pin) {
    setMessage("PIN을 입력해주세요.", "warn");
    return;
  }

  try {
    setBusy(true);
    setMessage("접속 중입니다...");
    const result = await rpc("workshop_login", { p_pin: pin });
    if (!result?.ok) {
      setMessage(result?.message || "PIN을 확인하지 못했습니다.", "error");
      return;
    }

    token = result.token;
    role = result.role;
    storage.set("workshopToken", token);
    storage.set("workshopRole", role);
    $("#pinInput").value = "";
    await loadState();
    setMessage("");
  } catch (error) {
    setMessage(`로그인 오류: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function logout() {
  try {
    if (token && supabaseClient) {
      await rpc("workshop_logout", { p_token: token });
    }
  } catch (_error) {
    // Local logout should still work if the network is unavailable.
  }

  token = "";
  role = "";
  selectedItem = null;
  storage.remove("workshopToken");
  storage.remove("workshopRole");
  normalizeState(DEFAULT_STATE);
  normalizePhotos([]);
  render();
}

async function loadState() {
  if (!token || isBusy) return;
  try {
    setBusy(true);
    const result = await rpc("workshop_get_state", { p_token: token });
    if (!result?.ok) {
      alert(result?.message || "세션이 만료되었습니다. 다시 로그인해주세요.");
      await logout();
      return;
    }

    role = result.role;
    storage.set("workshopRole", role);
    normalizeState(result.data);
    normalizePhotos(result.photos);
    render();
  } catch (error) {
    alert(`데이터 불러오기 실패: ${error.message}`);
  } finally {
    setBusy(false);
  }
}

async function saveState() {
  if (role !== "admin") return;
  const payload = {
    notes: appState.notes,
    shopping: appState.shopping,
    visitDone: appState.visitDone,
    checkins: appState.checkins,
    familyStatus: appState.familyStatus
  };

  const result = await rpc("workshop_save_state", { p_token: token, p_data: payload });
  if (!result?.ok) throw new Error(result?.message || "저장에 실패했습니다.");
}

function render() {
  const configured = hasConfig();
  $("#setupWarning").hidden = configured;
  $("#loginPanel").hidden = Boolean(token);
  $("#appPanel").hidden = !token;
  $("#logoutBtn").hidden = !token;
  $("#sessionLabel").textContent = token ? (role === "admin" ? "관리자 모드" : "가족 보기 모드") : "로그인 필요";

  if (!configured) {
    setMessage("Supabase 설정 전에는 PIN 확인을 할 수 없습니다.", "warn");
  }

  if (!token) return;

  document.querySelectorAll(".admin-only").forEach((el) => {
    el.hidden = role !== "admin";
  });

  renderTabs();
  renderStatus();
  renderSchedule();
  renderShopping();
  renderDetail(selectedItem);
}

function renderTabs() {
  const box = $("#dayTabs");
  box.replaceChildren();

  DAYS.forEach((day) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = day.label;
    button.className = day.id === selectedDay ? "active" : "";
    button.addEventListener("click", () => {
      selectedDay = day.id;
      selectedItem = null;
      render();
    });
    box.appendChild(button);
  });

  const day = DAYS.find((item) => item.id === selectedDay);
  $("#dayTitle").textContent = day?.title || "일정";
  $("#daySub").textContent = day?.sub || "";
}

function renderStatus() {
  const status = appState.familyStatus || DEFAULT_STATE.familyStatus;
  const box = $("#familyStatusView");
  box.replaceChildren();

  const strong = document.createElement("strong");
  strong.textContent = status.text || "아직 공유된 상태가 없습니다.";

  const memo = document.createElement("p");
  memo.textContent = status.memo || "관리자가 가족에게 공유할 상태를 저장하면 여기에 표시됩니다.";

  const time = document.createElement("small");
  time.textContent = status.updatedAt ? new Date(status.updatedAt).toLocaleString("ko-KR") : "업데이트 전";

  box.append(strong, memo, time);

  if (role === "admin") {
    $("#statusText").value = status.text || "";
    $("#statusMemo").value = status.memo || "";
  }
}

function renderSchedule() {
  const list = $("#scheduleList");
  list.replaceChildren();

  SCHEDULE.filter((item) => item.day === selectedDay).forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = [
      "schedule-card",
      selectedItem?.id === item.id ? "active" : "",
      appState.visitDone[item.id] ? "done" : ""
    ].filter(Boolean).join(" ");

    const time = document.createElement("span");
    time.className = "time";
    time.textContent = item.time;

    const body = document.createElement("span");
    body.className = "schedule-body";

    const title = document.createElement("strong");
    title.textContent = item.title;

    const place = document.createElement("span");
    place.className = "muted";
    place.textContent = item.place;

    body.append(title, place);
    if (appState.visitDone[item.id]) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = "방문 완료";
      body.appendChild(badge);
    }

    card.append(time, body);
    card.addEventListener("click", () => {
      selectedItem = item;
      render();
    });
    list.appendChild(card);
  });
}

function renderShopping() {
  const box = $("#shoppingList");
  if (!box) return;
  box.replaceChildren();

  SHOPPING.forEach((name, index) => {
    const id = `s${index}`;
    const label = document.createElement("label");
    label.className = "shopping-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(appState.shopping[id]);
    checkbox.addEventListener("change", async () => {
      appState.shopping[id] = checkbox.checked;
      try {
        await saveState();
      } catch (error) {
        checkbox.checked = !checkbox.checked;
        appState.shopping[id] = checkbox.checked;
        alert(error.message);
      }
    });

    const text = document.createElement("span");
    text.textContent = name;
    label.append(checkbox, text);
    box.appendChild(label);
  });
}

function renderDetail(item) {
  const empty = $("#emptyDetailText");
  const wrap = $("#detailContent");
  wrap.replaceChildren();

  if (!item) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const header = document.createElement("div");
  header.className = "detail-head";
  const time = document.createElement("p");
  time.className = "time";
  time.textContent = item.time;
  const title = document.createElement("h3");
  title.textContent = item.title;
  const place = document.createElement("p");
  place.className = "muted";
  place.textContent = item.place;
  header.append(time, title, place);

  const buttons = document.createElement("div");
  buttons.className = "button-row";
  const map = document.createElement("a");
  map.href = item.map;
  map.target = "_blank";
  map.rel = "noreferrer";
  map.textContent = "구글맵";
  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "ghost";
  copy.textContent = "장소 복사";
  copy.addEventListener("click", () => navigator.clipboard.writeText(`${item.title} / ${item.place}`));
  buttons.append(map, copy);

  wrap.append(header, buttons);
  renderCheckins(wrap, item);
  renderPhotoGallery(wrap, item);

  if (role === "admin") {
    renderAdminTools(wrap, item);
  }
}

function renderCheckins(wrap, item) {
  const itemCheckins = appState.checkins.filter((checkin) => checkin.itemId === item.id);
  const section = document.createElement("section");
  section.className = "mini-section";

  const h = document.createElement("h4");
  h.textContent = "체크인 기록";
  section.appendChild(h);

  if (!itemCheckins.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "아직 체크인 기록이 없습니다.";
    section.appendChild(p);
  } else {
    itemCheckins.slice().reverse().forEach((checkin) => {
      const row = document.createElement("a");
      row.className = "checkin-row";
      row.href = `https://maps.google.com/?q=${checkin.lat},${checkin.lng}`;
      row.target = "_blank";
      row.rel = "noreferrer";
      row.textContent = `${new Date(checkin.createdAt).toLocaleString("ko-KR")} · 정확도 ${Math.round(checkin.accuracy || 0)}m`;
      section.appendChild(row);
    });
  }

  wrap.appendChild(section);
}

function renderPhotoGallery(wrap, item) {
  const itemPhotos = photos.filter((photo) => photo.itemId === item.id || photo.item_id === item.id);
  const section = document.createElement("section");
  section.className = "mini-section";

  const title = document.createElement("h4");
  title.textContent = role === "admin" ? "사진" : "공유 사진";
  section.appendChild(title);

  if (!itemPhotos.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = role === "admin" ? "아직 업로드한 사진이 없습니다." : "가족에게 공유된 사진이 없습니다.";
    section.appendChild(empty);
    wrap.appendChild(section);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "photos";

  itemPhotos.forEach((photo) => {
    const card = document.createElement("div");
    card.className = "photo-card";

    const img = document.createElement("img");
    img.src = photo.dataUrl || photo.data_url;
    img.alt = photo.fileName || photo.file_name || "워크샵 사진";
    img.loading = "lazy";
    card.appendChild(img);

    if (role === "admin") {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost";
      remove.textContent = "삭제";
      remove.addEventListener("click", () => deletePhoto(photo.id));
      card.appendChild(remove);
    }

    grid.appendChild(card);
  });

  section.appendChild(grid);
  wrap.appendChild(section);
}

function renderAdminTools(wrap, item) {
  const form = document.createElement("section");
  form.className = "admin-tools stacked-form";

  const noteLabel = document.createElement("label");
  noteLabel.htmlFor = "noteInput";
  noteLabel.textContent = "관리자 메모";
  const note = document.createElement("textarea");
  note.id = "noteInput";
  note.placeholder = "업무 메모, 배운 점, 구매/상담 내용 등 가족에게 그대로 보이면 안 되는 내용을 적어도 됩니다.";
  note.value = appState.notes[item.id] || "";

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  const save = document.createElement("button");
  save.type = "button";
  save.textContent = "메모 저장";
  save.addEventListener("click", async () => {
    appState.notes[item.id] = note.value;
    appState.visitDone[item.id] = true;
    await withSave("메모를 저장했습니다.", () => saveState());
  });

  const checkinButton = document.createElement("button");
  checkinButton.type = "button";
  checkinButton.className = "ghost";
  checkinButton.textContent = "현재 위치 체크인";
  checkinButton.addEventListener("click", () => checkin(item));
  buttonRow.append(save, checkinButton);

  const photoLabel = document.createElement("label");
  photoLabel.htmlFor = "photoInput";
  photoLabel.textContent = "사진 업로드";
  const photoInput = document.createElement("input");
  photoInput.id = "photoInput";
  photoInput.type = "file";
  photoInput.accept = "image/*";
  photoInput.multiple = true;
  photoInput.addEventListener("change", () => addPhotos(item, photoInput.files));

  form.append(noteLabel, note, buttonRow, photoLabel, photoInput);
  wrap.appendChild(form);
}

async function withSave(successMessage, action) {
  try {
    await action();
    render();
    if (successMessage) {
      const previous = $("#sessionLabel").textContent;
      $("#sessionLabel").textContent = successMessage;
      window.setTimeout(() => {
        $("#sessionLabel").textContent = previous;
      }, 1400);
    }
  } catch (error) {
    alert(error.message);
  }
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      image.onload = () => {
        const max = 1280;
        let width = image.width;
        let height = image.height;

        if (width > height && width > max) {
          height = Math.round((height * max) / width);
          width = max;
        } else if (height >= width && height > max) {
          width = Math.round((width * max) / height);
          height = max;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.74));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addPhotos(item, files) {
  if (!files?.length) return;

  try {
    for (const file of files) {
      const dataUrl = await resizeImage(file);
      const result = await rpc("workshop_add_photo", {
        p_token: token,
        p_item_id: item.id,
        p_file_name: file.name,
        p_mime_type: "image/jpeg",
        p_data_url: dataUrl,
        p_shared_with_family: true
      });

      if (!result?.ok) throw new Error(result?.message || "사진 업로드에 실패했습니다.");
      photos.push(result.photo);
    }
    render();
  } catch (error) {
    alert(error.message);
  }
}

async function deletePhoto(photoId) {
  if (!photoId || !confirm("이 사진을 삭제할까요?")) return;
  try {
    const result = await rpc("workshop_delete_photo", { p_token: token, p_photo_id: photoId });
    if (!result?.ok) throw new Error(result?.message || "사진 삭제에 실패했습니다.");
    photos = photos.filter((photo) => photo.id !== photoId);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function checkin(item) {
  if (!navigator.geolocation) {
    alert("이 브라우저는 위치 체크인을 지원하지 않습니다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const checkinData = {
        itemId: item.id,
        title: item.title,
        place: item.place,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        createdAt: new Date().toISOString()
      };

      appState.checkins.push(checkinData);
      appState.visitDone[item.id] = true;
      appState.familyStatus = {
        text: `${item.title} 체크인`,
        memo: item.place,
        updatedAt: checkinData.createdAt
      };

      await withSave("체크인 저장 완료", () => saveState());
    },
    (error) => alert(`위치 저장 실패: ${error.message}`),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
}

$("#loginForm").addEventListener("submit", login);
$("#logoutBtn").addEventListener("click", logout);
$("#refreshBtn").addEventListener("click", loadState);
$("#saveStatusBtn").addEventListener("click", async () => {
  appState.familyStatus = {
    text: $("#statusText").value.trim(),
    memo: $("#statusMemo").value.trim(),
    updatedAt: new Date().toISOString()
  };
  await withSave("상태 저장 완료", () => saveState());
});

document.documentElement.dataset.workshopAppReady = "true";

if (hasConfig()) {
  const clientReady = ensureClient();
  if (clientReady && token) {
    loadState();
  } else {
    if (!clientReady) {
      token = "";
      role = "";
    }
    render();
  }
} else {
  render();
}
