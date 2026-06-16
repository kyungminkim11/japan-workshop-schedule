window.WORKSHOP_SUPABASE = {
  // Supabase Dashboard > Project Settings > API Keys
  // Use Project URL and anon public / publishable key only.
  // Never paste service_role, secret key, JWT secret, or database password here.
  url: "https://jnciddblcndmthmmvqrz.supabase.co",
  key: "sb_publishable_UUzSE7O9wqI0WN9cKG9OAQ_VleRkL4I"
};

// Compatibility bridge: the deployed frontend now calls workshop_login(p_code, p_client_info),
// but the current Supabase database may still expose the older workshop_login(p_pin).
// This keeps login from failing with "Could not find the function ... in the schema cache".
(function () {
  const schemaErrorPattern = /schema cache|could not find the function|pgrst202/i;
  const patch = () => {
    if (!window.supabase || !window.supabase.createClient || window.__workshopCompatPatched) return;
    const originalCreateClient = window.supabase.createClient.bind(window.supabase);
    window.supabase.createClient = function (...args) {
      const client = originalCreateClient(...args);
      const originalRpc = client.rpc.bind(client);
      client.rpc = async function (fn, params = {}, options) {
        if (fn === "workshop_login" && params && Object.prototype.hasOwnProperty.call(params, "p_code")) {
          const first = await originalRpc(fn, params, options);
          const message = [first?.error?.message, first?.error?.details, first?.error?.hint].filter(Boolean).join(" ");
          if (!first?.error || !schemaErrorPattern.test(message)) return first;
          return originalRpc(fn, { p_pin: params.p_code }, options);
        }
        if (fn === "workshop_add_photo" && params && Object.prototype.hasOwnProperty.call(params, "p_shared_with_girlfriend")) {
          const first = await originalRpc(fn, params, options);
          const message = [first?.error?.message, first?.error?.details, first?.error?.hint].filter(Boolean).join(" ");
          if (!first?.error || !schemaErrorPattern.test(message)) return first;
          const fallback = { ...params };
          delete fallback.p_shared_with_girlfriend;
          return originalRpc(fn, fallback, options);
        }
        return originalRpc(fn, params, options);
      };
      return client;
    };
    window.__workshopCompatPatched = true;
  };
  patch();
})();

// Admin quality-of-life patch: allow mistaken check-in records to be deleted.
(function () {
  const installStyle = () => {
    if (document.getElementById("checkinDeletePatchStyle")) return;
    const style = document.createElement("style");
    style.id = "checkinDeletePatchStyle";
    style.textContent = `
      .checkin-entry{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:8px;
        align-items:center;
        padding:9px 10px;
      }
      .checkin-entry .checkin-map-link{
        display:block;
        min-height:auto;
        overflow-wrap:anywhere;
        border:0;
        border-radius:0;
        background:transparent;
        color:inherit;
        padding:3px 0;
        box-shadow:none;
        font-weight:700;
      }
      .checkin-entry .checkin-map-link:hover{
        transform:none;
        box-shadow:none;
        text-decoration:underline;
      }
      .timeline-actions{
        display:flex;
        justify-content:flex-end;
        gap:8px;
        margin-top:8px;
      }
    `;
    document.head.appendChild(style);
  };

  const patch = () => {
    if (window.__workshopCheckinDeletePatch) return true;
    if (typeof renderCheckins !== "function" || typeof saveState !== "function" || typeof render !== "function") return false;

    const snapshot = (value) => JSON.parse(JSON.stringify(value));
    const latestCheckin = () => state.checkins
      .filter((item) => item && item.createdAt)
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;

    const hasItemPhoto = (itemId) => photos.some((photo) => (photo.itemId || photo.item_id) === itemId);
    const hasItemNote = (itemId) => Boolean(safeText(state.notes?.[itemId]));
    const hasItemCheckin = (itemId) => state.checkins.some((checkin) => checkin.itemId === itemId);

    const refreshFamilyStatusAfterDelete = (deleted) => {
      const current = state.familyStatus || {};
      const currentLooksLikeDeletedCheckin = current.updatedAt === deleted.createdAt && safeText(current.text).includes("체크인");
      if (!currentLooksLikeDeletedCheckin) return;

      const next = latestCheckin();
      if (!next) {
        state.familyStatus = { text: "", memo: "", updatedAt: "" };
        return;
      }

      const item = itemById(next.itemId);
      state.familyStatus = {
        text: `${next.title || item?.title || "위치"} 체크인`,
        memo: next.place || item?.place || "",
        updatedAt: next.createdAt
      };
    };

    window.deleteCheckinAt = async function (index) {
      if (role !== "admin") return;
      const target = state.checkins[index];
      if (!target) return alert("삭제할 체크인 기록을 찾지 못했습니다.");

      const title = target.title || itemById(target.itemId)?.title || "체크인";
      if (!confirm(`${title}\n${fmt(target.createdAt)}\n\n이 체크인 기록을 삭제할까요?`)) return;

      const before = {
        checkins: snapshot(state.checkins),
        visitDone: snapshot(state.visitDone),
        familyStatus: snapshot(state.familyStatus)
      };

      try {
        state.checkins.splice(index, 1);
        if (!hasItemCheckin(target.itemId) && !hasItemNote(target.itemId) && !hasItemPhoto(target.itemId)) {
          delete state.visitDone[target.itemId];
        }
        refreshFamilyStatusAfterDelete(target);
        await saveState();
        render();
        if (typeof flash === "function") flash("체크인 삭제 완료");
      } catch (error) {
        state.checkins = before.checkins;
        state.visitDone = before.visitDone;
        state.familyStatus = before.familyStatus;
        render();
        alert(`체크인 삭제 실패: ${error.message}`);
      }
    };

    renderCheckins = function (wrap, item) {
      const sec = document.createElement("section");
      sec.className = "mini-section";
      sec.innerHTML = "<h4>체크인 기록</h4>";

      const rows = state.checkins
        .map((checkin, index) => ({ checkin, index }))
        .filter(({ checkin }) => checkin.itemId === item.id)
        .slice()
        .reverse();

      if (!rows.length) {
        sec.innerHTML += '<p class="muted">아직 체크인 기록이 없습니다.</p>';
      }

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
    };

    if (typeof collectTimelineItems === "function") {
      collectTimelineItems = function () {
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
        photos.forEach((photo) => {
          const item = itemById(photo.itemId || photo.item_id);
          items.push({ type: "사진", at: photo.createdAt || photo.created_at, title: item?.title ? `${item.title} 사진` : "사진 업로드", text: item?.place || photo.fileName || photo.file_name || "", image: photo.dataUrl || photo.data_url });
        });
        if (role === "admin") Object.entries(state.notes).forEach(([id, note]) => {
          if (safeText(note)) {
            const item = itemById(id);
            items.push({ type: "비공개 메모", at: nowIso(), title: item?.title ? `${item.title} 메모` : "관리자 메모", text: safeText(note), private: true });
          }
        });
        items.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
        return items;
      };
    }

    if (typeof renderTimelineCard === "function") {
      const originalRenderTimelineCard = renderTimelineCard;
      renderTimelineCard = function (box, item, compact = false) {
        originalRenderTimelineCard(box, item, compact);
        if (compact || role !== "admin" || item.type !== "체크인" || !Number.isInteger(item.checkinIndex)) return;
        const card = box.lastElementChild;
        if (!card) return;
        const actions = document.createElement("div");
        actions.className = "timeline-actions";
        const del = document.createElement("button");
        del.className = "ghost danger small";
        del.type = "button";
        del.textContent = "체크인 삭제";
        del.onclick = () => window.deleteCheckinAt(item.checkinIndex);
        actions.appendChild(del);
        card.appendChild(actions);
      };
    }

    installStyle();
    window.__workshopCheckinDeletePatch = true;
    if (typeof render === "function") render();
    return true;
  };

  if (!patch()) {
    const timer = setInterval(() => {
      if (patch()) clearInterval(timer);
    }, 80);
    setTimeout(() => clearInterval(timer), 10000);
  }
})();

// Load the media export helper after the base app scripts are ready.
(function () {
  const loadMediaExportPatch = () => {
    if (document.querySelector('script[src*="media-export-patch.js"]')) return;
    const script = document.createElement("script");
    script.src = "media-export-patch.js?v=20260617-media-1";
    document.head.appendChild(script);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadMediaExportPatch, { once: true });
  else loadMediaExportPatch();
})();