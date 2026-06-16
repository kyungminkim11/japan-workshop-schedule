(function () {
  const MEMO_VISIBILITY = {
    private: { label: "비공개", visibleTo: [], chip: "비공개 메모" },
    public: { label: "전체 공개", visibleTo: ["family", "girlfriend"], chip: "공개 메모" },
    family: { label: "가족 공개", visibleTo: ["family"], chip: "가족 공개 메모" },
    girlfriend: { label: "여자친구 공개", visibleTo: ["girlfriend"], chip: "여자친구 공개 메모" },
    family_girlfriend: { label: "가족+여자친구 공개", visibleTo: ["family", "girlfriend"], chip: "선택 공개 메모" }
  };

  function installMemoStyle() {
    if (document.getElementById("memoPatchStyle")) return;
    const style = document.createElement("style");
    style.id = "memoPatchStyle";
    style.textContent = `
      .memo-composer,.memo-list-section{border-top:1px dashed var(--line);margin-top:15px;padding-top:15px}
      .memo-composer h4,.memo-list-section h4{margin-bottom:8px}
      .memo-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .memo-grid .wide{grid-column:1/-1}
      .memo-location-toggle{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:8px;background:#fff;padding:10px;color:var(--muted);font-size:13px;font-weight:700}
      .memo-location-toggle input{width:auto;accent-color:var(--accent)}
      .memo-list{display:grid;gap:9px}
      .memo-item{border:1px solid var(--line);border-radius:8px;background:#fff;padding:11px}
      .memo-item.private{border-color:#fde68a;background:#fffbeb}
      .memo-item-head,.memo-card-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
      .memo-item h5{margin:7px 0 6px;font-size:15px}
      .memo-item p{margin:0 0 8px;white-space:pre-wrap;line-height:1.6}
      .memo-chip{display:inline-flex;align-items:center;border:1px solid #99f6e4;border-radius:999px;background:#ecfdf5;color:var(--accent);font-size:12px;font-weight:900;padding:4px 9px}
      .memo-chip.private{border-color:#fde68a;background:#fffbeb;color:#b45309}
      .memo-sub{color:var(--muted);font-size:12px;line-height:1.5}
      .memo-media-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:9px}
      .memo-media-grid img,.memo-media-grid video{display:block;width:100%;max-height:260px;border:1px solid var(--line);border-radius:8px;background:#000;object-fit:cover}
      .memo-media-grid video{object-fit:contain}
      .timeline-card.memo-private{border-color:#fde68a;background:#fffbeb}
      @media(max-width:430px){.memo-grid{grid-template-columns:1fr}.memo-media-grid{grid-template-columns:1fr}.memo-item-head,.memo-card-actions{align-items:flex-start}}
    `;
    document.head.appendChild(style);
  }

  function visibilityMeta(value) {
    return MEMO_VISIBILITY[value] || MEMO_VISIBILITY.private;
  }

  function getMemoMediaItemId(memoOrId) {
    const id = typeof memoOrId === "string" ? memoOrId : memoOrId?.id;
    return `memo:${String(id || "").slice(0, 27)}`.slice(0, 32);
  }

  function normalizeMemoEntries(entries) {
    return (Array.isArray(entries) ? entries : []).map((entry) => {
      const visibility = MEMO_VISIBILITY[entry?.visibility] ? entry.visibility : "private";
      const visibleTo = Array.isArray(entry?.visibleTo) ? entry.visibleTo.filter((x) => ["family", "girlfriend"].includes(x)) : visibilityMeta(visibility).visibleTo;
      const lat = Number(entry?.lat), lng = Number(entry?.lng), accuracy = Number(entry?.accuracy);
      const id = safeText(entry?.id || makeId("m")).slice(0, 24) || makeId("m").slice(0, 24);
      return {
        id,
        itemId: safeText(entry?.itemId).slice(0, 32),
        itemTitle: safeText(entry?.itemTitle).slice(0, 120),
        place: safeText(entry?.place).slice(0, 180),
        scheduleTime: safeText(entry?.scheduleTime).slice(0, 40),
        scheduleDay: safeText(entry?.scheduleDay).slice(0, 8),
        map: safeText(entry?.map).slice(0, 500),
        title: safeText(entry?.title).slice(0, 120),
        text: safeText(entry?.text).slice(0, 2000),
        visibility,
        visibleTo,
        mediaItemId: safeText(entry?.mediaItemId || getMemoMediaItemId(id)).slice(0, 32),
        createdAt: safeText(entry?.createdAt) || nowIso(),
        updatedAt: safeText(entry?.updatedAt || entry?.createdAt) || nowIso(),
        ...(Number.isFinite(lat) ? { lat } : {}),
        ...(Number.isFinite(lng) ? { lng } : {}),
        ...(Number.isFinite(accuracy) ? { accuracy } : {})
      };
    }).filter((entry) => entry.id && (entry.text || entry.title || entry.itemTitle)).slice(0, 200);
  }

  function canViewMemo(entry) {
    if (role === "admin") return true;
    if (!entry) return false;
    if (entry.visibility === "public") return true;
    return Array.isArray(entry.visibleTo) && entry.visibleTo.includes(role);
  }

  function memoMedia(entryOrId) {
    const mediaItemId = typeof entryOrId === "string" ? getMemoMediaItemId(entryOrId) : (entryOrId?.mediaItemId || getMemoMediaItemId(entryOrId?.id));
    return photos.filter((photo) => (photo.itemId || photo.item_id) === mediaItemId);
  }

  function isVideoMedia(media) {
    return String(media?.mimeType || media?.mime_type || "").startsWith("video/");
  }

  function renderMediaGrid(box, mediaItems) {
    if (!mediaItems?.length) return;
    const grid = document.createElement("div");
    grid.className = "memo-media-grid";
    mediaItems.forEach((media) => {
      const src = media.dataUrl || media.data_url;
      if (!src) return;
      if (isVideoMedia(media)) {
        const video = document.createElement("video");
        video.src = src;
        video.controls = true;
        video.preload = "metadata";
        grid.appendChild(video);
      } else {
        const img = document.createElement("img");
        img.src = src;
        img.alt = media.fileName || media.file_name || "메모 첨부 이미지";
        img.loading = "lazy";
        grid.appendChild(img);
      }
    });
    if (grid.childElementCount) box.appendChild(grid);
  }

  function memoVisibilityText(entry) {
    const meta = visibilityMeta(entry?.visibility);
    return meta.chip || meta.label;
  }

  function memoVisibilityClass(entry) {
    return entry?.visibility === "private" ? "memo-chip private" : "memo-chip";
  }

  function memoPlaceLine(entry) {
    const parts = [entry.scheduleTime, entry.itemTitle, entry.place].map(safeText).filter(Boolean);
    return parts.join(" · ");
  }

  function getMemoGeo(include) {
    if (!include || !navigator.geolocation) return Promise.resolve(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 }
      );
    });
  }

  function fileToMemoData(file) {
    const type = String(file.type || "");
    if (type.startsWith("image/")) {
      return resizeImage(file).then((dataUrl) => ({ dataUrl, mimeType: "image/jpeg" }));
    }
    const isVideo = type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name || "");
    if (!isVideo) return Promise.reject(new Error(`${file.name || "파일"}은 지원하지 않는 형식입니다.`));
    if (file.size > 4300000) return Promise.reject(new Error(`${file.name || "영상"}이 너무 큽니다. 4MB 안팎의 짧은 영상만 올려주세요.`));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result, mimeType: type || (file.name?.toLowerCase().endsWith(".webm") ? "video/webm" : file.name?.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4") });
      reader.onerror = () => reject(new Error(`${file.name || "영상"}을 읽지 못했습니다.`));
      reader.readAsDataURL(file);
    });
  }

  function shareFlagsForMemo(entry) {
    const visibleTo = Array.isArray(entry.visibleTo) ? entry.visibleTo : visibilityMeta(entry.visibility).visibleTo;
    return {
      family: entry.visibility === "public" || visibleTo.includes("family"),
      girlfriend: entry.visibility === "public" || visibleTo.includes("girlfriend")
    };
  }

  async function uploadMemoFiles(entry, files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    const flags = shareFlagsForMemo(entry);
    for (const file of list) {
      const { dataUrl, mimeType } = await fileToMemoData(file);
      const result = await rpc("workshop_add_photo", {
        p_token: token,
        p_item_id: entry.mediaItemId || getMemoMediaItemId(entry.id),
        p_file_name: file.name || (mimeType.startsWith("video/") ? "memo-video.mp4" : "memo-photo.jpg"),
        p_mime_type: mimeType,
        p_data_url: dataUrl,
        p_shared_with_family: flags.family,
        p_shared_with_girlfriend: flags.girlfriend
      });
      if (!result?.ok) throw new Error(result?.message || "첨부 업로드 실패");
      photos.push(result.photo);
    }
  }

  async function saveQuickMemo(item, form) {
    if (role !== "admin" || !item) return;
    const title = safeText(form.querySelector("[data-memo-title]")?.value).slice(0, 120);
    const text = safeText(form.querySelector("[data-memo-text]")?.value).slice(0, 2000);
    const visibility = form.querySelector("[data-memo-visibility]")?.value || "private";
    const files = Array.from(form.querySelector("[data-memo-files]")?.files || []);
    const includeLocation = Boolean(form.querySelector("[data-memo-location]")?.checked);
    const messageEl = form.querySelector("[data-memo-message]");
    if (!title && !text && !files.length) {
      if (messageEl) { messageEl.textContent = "메모 내용이나 첨부 파일을 추가해주세요."; messageEl.className = "message warn"; }
      return;
    }

    const id = makeId("m").slice(0, 24);
    const geo = await getMemoGeo(includeLocation);
    const baseCoords = coords(item);
    const entry = {
      id,
      itemId: item.id,
      itemTitle: item.title,
      place: item.place,
      scheduleTime: item.time,
      scheduleDay: item.day,
      map: mapUrl(item),
      title: title || item.title || "메모",
      text,
      visibility,
      visibleTo: visibilityMeta(visibility).visibleTo,
      mediaItemId: getMemoMediaItemId(id),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...(geo || (baseCoords ? { lat: baseCoords[0], lng: baseCoords[1] } : {}))
    };
    if (geo?.accuracy) entry.accuracy = geo.accuracy;

    const beforeEntries = clone(state.memoEntries || []);
    try {
      if (messageEl) { messageEl.textContent = "메모 저장 중입니다..."; messageEl.className = "message"; }
      state.memoEntries = normalizeMemoEntries([entry, ...(state.memoEntries || [])]);
      state.visitDone[item.id] = true;
      await saveState();
      await uploadMemoFiles(entry, files);
      form.reset();
      const visibilityInput = form.querySelector("[data-memo-visibility]");
      if (visibilityInput) visibilityInput.value = "private";
      const locationInput = form.querySelector("[data-memo-location]");
      if (locationInput) locationInput.checked = true;
      if (messageEl) { messageEl.textContent = "메모를 저장했습니다."; messageEl.className = "message success"; }
      render();
      if (typeof flash === "function") flash("메모 저장 완료");
    } catch (error) {
      state.memoEntries = beforeEntries;
      await saveState().catch(() => {});
      if (messageEl) { messageEl.textContent = error.message; messageEl.className = "message error"; }
      else alert(error.message);
    }
  }

  async function deleteMemoEntry(id) {
    if (role !== "admin") return;
    const entry = (state.memoEntries || []).find((memo) => memo.id === id);
    if (!entry) return alert("삭제할 메모를 찾지 못했습니다.");
    if (!confirm(`${entry.title || entry.itemTitle || "메모"}\n\n이 메모와 첨부를 삭제할까요?`)) return;
    const beforeEntries = clone(state.memoEntries || []);
    const beforePhotos = clone(photos || []);
    try {
      const media = memoMedia(entry);
      for (const mediaItem of media) {
        const result = await rpc("workshop_delete_photo", { p_token: token, p_photo_id: mediaItem.id });
        if (!result?.ok) throw new Error(result?.message || "첨부 삭제 실패");
      }
      state.memoEntries = (state.memoEntries || []).filter((memo) => memo.id !== id);
      photos = photos.filter((photo) => (photo.itemId || photo.item_id) !== (entry.mediaItemId || getMemoMediaItemId(entry.id)));
      await saveState();
      render();
      if (typeof flash === "function") flash("메모 삭제 완료");
    } catch (error) {
      state.memoEntries = beforeEntries;
      photos = beforePhotos;
      render();
      alert(`메모 삭제 실패: ${error.message}`);
    }
  }

  function renderMemoComposer(wrap, item) {
    const sec = document.createElement("section");
    sec.className = "memo-composer";
    sec.innerHTML = `
      <h4>빠른 메모</h4>
      <form class="memo-grid">
        <label>제목<input data-memo-title placeholder="예: 방문 후기, 구매 후보, 미팅 메모" /></label>
        <label>공개 범위
          <select data-memo-visibility>
            <option value="private">비공개 · 관리자만</option>
            <option value="public">공개 · 모두에게 표시</option>
            <option value="family">가족에게만 표시</option>
            <option value="girlfriend">여자친구에게만 표시</option>
            <option value="family_girlfriend">가족+여자친구에게 표시</option>
          </select>
        </label>
        <label class="wide">메모<textarea data-memo-text placeholder="현장에서 바로 적어두세요. 시간, 일정, 장소는 자동으로 함께 저장됩니다."></textarea></label>
        <label class="wide">사진/짧은 영상 첨부<input data-memo-files type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple /></label>
        <label class="wide memo-location-toggle"><input data-memo-location type="checkbox" checked /> 현재 위치도 함께 기록</label>
        <div class="button-row wide"><button type="submit">메모 저장</button></div>
        <p data-memo-message class="message wide" role="status"></p>
      </form>
    `;
    const form = sec.querySelector("form");
    form.onsubmit = (event) => { event.preventDefault(); saveQuickMemo(item, form); };
    wrap.appendChild(sec);
  }

  function renderItemMemoList(wrap, item) {
    const entries = (state.memoEntries || []).filter((memo) => memo.itemId === item.id && canViewMemo(memo));
    if (!entries.length) return;
    const sec = document.createElement("section");
    sec.className = "memo-list-section";
    sec.innerHTML = "<h4>메모 기록</h4>";
    const list = document.createElement("div");
    list.className = "memo-list";
    entries.forEach((entry) => {
      const card = document.createElement("article");
      card.className = `memo-item ${entry.visibility === "private" ? "private" : ""}`.trim();
      const head = document.createElement("div");
      head.className = "memo-item-head";
      head.innerHTML = `<span class="${memoVisibilityClass(entry)}">${memoVisibilityText(entry)}</span><small class="memo-sub">${fmt(entry.createdAt)}</small>`;
      const title = document.createElement("h5");
      title.textContent = entry.title || entry.itemTitle || "메모";
      const text = document.createElement("p");
      text.textContent = entry.text || "첨부만 저장된 메모입니다.";
      const sub = document.createElement("div");
      sub.className = "memo-sub";
      sub.textContent = memoPlaceLine(entry);
      card.append(head, title, text, sub);
      renderMediaGrid(card, memoMedia(entry));
      if (role === "admin") {
        const actions = document.createElement("div");
        actions.className = "memo-card-actions";
        const del = document.createElement("button");
        del.className = "ghost danger small";
        del.type = "button";
        del.textContent = "메모 삭제";
        del.onclick = () => deleteMemoEntry(entry.id);
        actions.appendChild(del);
        card.appendChild(actions);
      }
      list.appendChild(card);
    });
    sec.appendChild(list);
    wrap.appendChild(sec);
  }

  function buildTimelineItems() {
    const items = [];
    const st = state.familyStatus || {};
    if (st.updatedAt && (st.text || st.memo)) items.push({ type: "상태", at: st.updatedAt, title: st.text || "공유 상태", text: st.memo });

    state.checkins.forEach((checkin, index) => {
      const item = itemById(checkin.itemId);
      items.push({
        type: "체크인",
        at: checkin.createdAt,
        title: `${checkin.title || item?.title || "위치"} 체크인`,
        text: checkin.place || item?.place || "",
        map: Number.isFinite(Number(checkin.lat)) ? `https://maps.google.com/?q=${checkin.lat},${checkin.lng}` : "",
        checkinIndex: index
      });
    });

    (state.memoEntries || []).filter(canViewMemo).forEach((memo) => {
      items.push({
        type: memoVisibilityText(memo),
        at: memo.createdAt,
        title: memo.title || memo.itemTitle || "메모",
        text: memo.text,
        map: Number.isFinite(Number(memo.lat)) ? `https://maps.google.com/?q=${memo.lat},${memo.lng}` : memo.map,
        private: memo.visibility === "private",
        memoEntry: memo,
        media: memoMedia(memo)
      });
    });

    photos.forEach((photo) => {
      const itemId = photo.itemId || photo.item_id;
      if (String(itemId || "").startsWith("memo:")) return;
      const item = itemById(itemId);
      items.push({ type: isVideoMedia(photo) ? "영상" : "사진", at: photo.createdAt || photo.created_at, title: item?.title ? `${item.title} ${isVideoMedia(photo) ? "영상" : "사진"}` : "첨부 업로드", text: item?.place || photo.fileName || photo.file_name || "", image: isVideoMedia(photo) ? "" : (photo.dataUrl || photo.data_url), video: isVideoMedia(photo) ? (photo.dataUrl || photo.data_url) : "" });
    });

    if (role === "admin") Object.entries(state.notes || {}).forEach(([id, note]) => {
      if (safeText(note)) {
        const item = itemById(id);
        items.push({ type: "비공개 장소 메모", at: nowIso(), title: item?.title ? `${item.title} 메모` : "관리자 메모", text: safeText(note), private: true });
      }
    });

    items.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
    return items;
  }

  function renderMemoTimelineCard(box, item, compact) {
    const entry = item.memoEntry;
    const card = document.createElement("article");
    card.className = `timeline-card ${entry.visibility === "private" ? "private memo-private" : ""} ${compact ? "compact" : ""}`.trim();
    const placeLine = memoPlaceLine(entry);
    card.innerHTML = `<div class="timeline-meta"><span>${memoVisibilityText(entry)}</span><small>${fmt(item.at)}</small></div><h3>${item.title || "메모"}</h3>${item.text ? `<p>${item.text.length > (compact ? 90 : 220) ? `${item.text.slice(0, compact ? 90 : 220)}…` : item.text}</p>` : ""}${placeLine ? `<div class="memo-sub">${placeLine}</div>` : ""}`;
    if (!compact) {
      renderMediaGrid(card, item.media || []);
      if (item.map) {
        const a = document.createElement("a");
        a.className = "ghost small";
        a.href = item.map;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.textContent = "지도 열기";
        card.appendChild(a);
      }
      if (role === "admin") {
        const actions = document.createElement("div");
        actions.className = "memo-card-actions";
        const del = document.createElement("button");
        del.className = "ghost danger small";
        del.type = "button";
        del.textContent = "메모 삭제";
        del.onclick = () => deleteMemoEntry(entry.id);
        actions.appendChild(del);
        card.appendChild(actions);
      }
    }
    box.appendChild(card);
  }

  function renderCheckinRows(wrap, item) {
    const sec = document.createElement("section");
    sec.className = "mini-section";
    sec.innerHTML = "<h4>체크인 기록</h4>";
    const rows = state.checkins.map((checkin, index) => ({ checkin, index })).filter(({ checkin }) => checkin.itemId === item.id).slice().reverse();
    if (!rows.length) sec.innerHTML += '<p class="muted">아직 체크인 기록이 없습니다.</p>';
    rows.forEach(({ checkin, index }) => {
      if (role !== "admin") {
        const link = document.createElement("a");
        link.className = "checkin-row";
        link.href = `https://maps.google.com/?q=${checkin.lat},${checkin.lng}`;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = `${fmt(checkin.createdAt)} · 정확도 ${Math.round(checkin.accuracy || 0)}m`;
        sec.appendChild(link);
        return;
      }
      const row = document.createElement("div");
      row.className = "checkin-row checkin-entry";
      const link = document.createElement("a");
      link.className = "checkin-map-link";
      link.href = `https://maps.google.com/?q=${checkin.lat},${checkin.lng}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = `${fmt(checkin.createdAt)} · 정확도 ${Math.round(checkin.accuracy || 0)}m`;
      const del = document.createElement("button");
      del.className = "ghost danger small";
      del.type = "button";
      del.textContent = "삭제";
      del.onclick = () => window.deleteCheckinAt(index);
      row.append(link, del);
      sec.appendChild(row);
    });
    wrap.appendChild(sec);
  }

  function installPatch() {
    if (window.__workshopMemoPatch) return true;
    if (typeof normalizeState !== "function" || typeof saveState !== "function" || typeof renderAdminTools !== "function" || typeof renderTimelineCard !== "function" || typeof renderCheckins !== "function") return false;

    installMemoStyle();

    const originalNormalizeState = normalizeState;
    normalizeState = function (incoming = {}) {
      originalNormalizeState(incoming);
      state.memoEntries = normalizeMemoEntries(incoming.memoEntries);
    };

    saveState = async function () {
      if (role !== "admin") return;
      state.memoEntries = normalizeMemoEntries(state.memoEntries);
      const payload = {
        notes: state.notes,
        memoEntries: state.memoEntries,
        schedule: state.schedule,
        expenses: state.expenses,
        shoppingItems: state.shoppingItems,
        shopping: state.shopping,
        girlfriendRequests: state.girlfriendRequests,
        visitDone: state.visitDone,
        checkins: state.checkins,
        familyStatus: state.familyStatus
      };
      const result = await rpc("workshop_save_state", { p_token: token, p_data: payload });
      if (!result?.ok) throw new Error(result?.message || "저장 실패");
    };

    const originalRenderAdminTools = renderAdminTools;
    renderAdminTools = function (wrap, item) {
      renderMemoComposer(wrap, item);
      renderItemMemoList(wrap, item);
      originalRenderAdminTools(wrap, item);
    };

    renderCheckins = renderCheckinRows;

    collectTimelineItems = buildTimelineItems;

    const originalRenderTimelineCard = renderTimelineCard;
    renderTimelineCard = function (box, item, compact = false) {
      if (item.memoEntry) return renderMemoTimelineCard(box, item, compact);
      originalRenderTimelineCard(box, item, compact);
      if (!compact && item.video) {
        const card = box.lastElementChild;
        const video = document.createElement("video");
        video.src = item.video;
        video.controls = true;
        video.preload = "metadata";
        video.style.width = "100%";
        video.style.borderRadius = "8px";
        video.style.marginTop = "8px";
        card?.appendChild(video);
      }
      if (!compact && role === "admin" && item.type === "체크인" && Number.isInteger(item.checkinIndex)) {
        const card = box.lastElementChild;
        if (!card || card.querySelector("[data-checkin-delete]")) return;
        const actions = document.createElement("div");
        actions.className = "timeline-actions";
        const del = document.createElement("button");
        del.dataset.checkinDelete = "true";
        del.className = "ghost danger small";
        del.type = "button";
        del.textContent = "체크인 삭제";
        del.onclick = () => window.deleteCheckinAt(item.checkinIndex);
        actions.appendChild(del);
        card.appendChild(actions);
      }
    };

    window.deleteMemoEntry = deleteMemoEntry;
    window.__workshopMemoPatch = true;
    window.__workshopCheckinDeletePatch = true;

    if (typeof loadState === "function" && token) loadState(true);
    else if (typeof render === "function") render();
    return true;
  }

  if (!installPatch()) {
    const timer = setInterval(() => {
      if (installPatch()) clearInterval(timer);
    }, 80);
    setTimeout(() => clearInterval(timer), 10000);
  }
})();