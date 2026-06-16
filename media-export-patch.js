(function () {
  const ZIP_LIB_URL = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

  function installMediaExportStyle() {
    if (document.getElementById("mediaExportPatchStyle")) return;
    const style = document.createElement("style");
    style.id = "mediaExportPatchStyle";
    style.textContent = `
      .media-export-panel{display:grid;gap:10px}
      .media-export-actions{display:flex;gap:8px;flex-wrap:wrap}
      .media-export-note{margin:0;color:var(--muted);font-size:13px;line-height:1.55}
      .camera-save-hint{display:block;margin-top:6px;color:var(--muted);font-size:12px;line-height:1.5}
    `;
    document.head.appendChild(style);
  }

  function safeName(value, fallback = "file") {
    return String(value || fallback)
      .replace(/[\\/:*?"<>|]+/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || fallback;
  }

  function currentDayId() {
    try {
      if (typeof selectedDay === "string" && selectedDay) return selectedDay;
    } catch {}
    const active = document.querySelector("#dayTabs button.active")?.textContent || "";
    const found = (typeof DAYS !== "undefined" ? DAYS : []).find((day) => active.includes(day.label));
    return found?.id || "";
  }

  function dayMeta(dayId) {
    try {
      return DAYS.find((day) => day.id === dayId) || { id: dayId, label: dayId, title: dayId };
    } catch {
      return { id: dayId, label: dayId, title: dayId };
    }
  }

  function isVideo(media) {
    return String(media?.mimeType || media?.mime_type || "").startsWith("video/");
  }

  function mediaDataUrl(media) {
    return media?.dataUrl || media?.data_url || "";
  }

  function mediaItemId(media) {
    return media?.itemId || media?.item_id || "";
  }

  function mimeToExt(mime, dataUrl = "") {
    const type = String(mime || dataUrl.split(";")[0].replace("data:", "")).toLowerCase();
    if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
    if (type.includes("png")) return "png";
    if (type.includes("webp")) return "webp";
    if (type.includes("webm")) return "webm";
    if (type.includes("quicktime")) return "mov";
    if (type.includes("mp4")) return "mp4";
    return type.startsWith("video/") ? "mp4" : "jpg";
  }

  function memoMediaId(memo) {
    if (memo?.mediaItemId) return memo.mediaItemId;
    return `memo:${String(memo?.id || "").slice(0, 27)}`.slice(0, 32);
  }

  function ownerForMedia(media) {
    const itemId = mediaItemId(media);
    if (!itemId) return { day: "", title: "첨부", place: "" };

    if (itemId.startsWith("memo:")) {
      const memo = (state.memoEntries || []).find((entry) => memoMediaId(entry) === itemId);
      if (memo) return { day: memo.scheduleDay, title: memo.title || memo.itemTitle || "메모", place: memo.place || "" };
      return { day: "", title: "메모 첨부", place: "" };
    }

    const item = typeof itemById === "function" ? itemById(itemId) : (state.schedule || []).find((row) => row.id === itemId);
    if (item) return { day: item.day, title: item.title || "일정", place: item.place || "" };

    if (String(itemId).startsWith("expense:")) return { day: "", title: "영수증", place: "" };
    return { day: "", title: media.fileName || media.file_name || "첨부", place: "" };
  }

  function visibleMediaForDay(dayId) {
    return (photos || [])
      .map((media, index) => ({ media, index, owner: ownerForMedia(media) }))
      .filter(({ media, owner }) => mediaDataUrl(media) && owner.day === dayId);
  }

  function dataUrlToBlob(dataUrl) {
    const parts = String(dataUrl || "").split(",");
    if (parts.length < 2) throw new Error("파일 데이터가 올바르지 않습니다.");
    const mime = parts[0].match(/data:([^;]+)/)?.[1] || "application/octet-stream";
    const binary = atob(parts.slice(1).join(","));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function loadZipLib() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${ZIP_LIB_URL}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(window.JSZip), { once: true });
        existing.addEventListener("error", () => reject(new Error("ZIP 라이브러리를 불러오지 못했습니다.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = ZIP_LIB_URL;
      script.onload = () => window.JSZip ? resolve(window.JSZip) : reject(new Error("ZIP 라이브러리를 사용할 수 없습니다."));
      script.onerror = () => reject(new Error("ZIP 라이브러리를 불러오지 못했습니다."));
      document.head.appendChild(script);
    });
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function downloadVisibleDayMedia() {
    const dayId = currentDayId();
    const day = dayMeta(dayId);
    const rows = visibleMediaForDay(dayId);
    if (!rows.length) return alert(`${day.label || dayId}에 다운로드할 사진/영상이 없습니다.`);

    const button = document.getElementById("downloadDayMediaBtn");
    const oldText = button?.textContent;
    if (button) { button.disabled = true; button.textContent = "ZIP 만드는 중..."; }

    try {
      const JSZip = await loadZipLib();
      const zip = new JSZip();
      const folder = zip.folder(safeName(`${day.label || dayId}_${day.title || "media"}`, "workshop-media"));
      const lines = [`${day.label || dayId} ${day.title || ""}`, `생성: ${new Date().toLocaleString("ko-KR")}`, `파일 수: ${rows.length}`, ""];

      rows.forEach(({ media, index, owner }, i) => {
        const dataUrl = mediaDataUrl(media);
        const mime = media.mimeType || media.mime_type || "";
        const ext = mimeToExt(mime, dataUrl);
        const time = (media.createdAt || media.created_at || "").slice(0, 19).replace(/[T:]/g, "-") || String(i + 1).padStart(2, "0");
        const label = safeName(`${String(i + 1).padStart(2, "0")}_${time}_${owner.title || media.fileName || media.file_name || "media"}`, `media_${i + 1}`);
        folder.file(`${label}.${ext}`, dataUrlToBlob(dataUrl));
        lines.push(`${i + 1}. ${owner.title || "첨부"} / ${owner.place || "장소 정보 없음"} / ${media.fileName || media.file_name || "파일명 없음"}`);
      });

      folder.file("README.txt", lines.join("\n"));
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(`japan-workshop-${dayId || "day"}-media.zip`, blob);
    } catch (error) {
      alert(`다운로드 실패: ${error.message}`);
    } finally {
      if (button) { button.disabled = false; button.textContent = oldText || "선택 날짜 사진/영상 다운로드"; }
    }
  }

  function updatePanelSummary() {
    const summary = document.getElementById("mediaExportSummary");
    if (!summary) return;
    const dayId = currentDayId();
    const day = dayMeta(dayId);
    const rows = visibleMediaForDay(dayId);
    const imageCount = rows.filter(({ media }) => !isVideo(media)).length;
    const videoCount = rows.filter(({ media }) => isVideo(media)).length;
    summary.textContent = `${day.label || dayId} 기준 · 사진 ${imageCount}개 · 영상 ${videoCount}개`;
  }

  function injectPanel() {
    if (document.getElementById("mediaExportPanel")) return;
    const appPanel = document.getElementById("appPanel");
    const bottomNav = document.getElementById("bottomNav");
    if (!appPanel || !bottomNav) return;

    const panel = document.createElement("section");
    panel.id = "mediaExportPanel";
    panel.className = "panel media-export-panel";
    panel.dataset.appView = "home timeline";
    panel.innerHTML = `
      <div class="panel-title-row">
        <div>
          <h2>사진/영상 다운로드</h2>
          <p id="mediaExportSummary" class="muted">선택 날짜의 보이는 첨부를 모아 다운로드합니다.</p>
        </div>
      </div>
      <div class="media-export-actions">
        <button id="downloadDayMediaBtn" class="ghost" type="button">선택 날짜 사진/영상 다운로드</button>
      </div>
      <p class="media-export-note">현재 접속 권한에서 보이는 사진/영상만 ZIP으로 저장됩니다.</p>
    `;
    appPanel.insertBefore(panel, bottomNav);
    panel.querySelector("#downloadDayMediaBtn").onclick = downloadVisibleDayMedia;
    updatePanelSummary();
    if (typeof syncAppView === "function") syncAppView();
  }

  function enhanceCaptureInputs() {
    const inputs = Array.from(document.querySelectorAll("#photoInput,[data-memo-files]"));
    inputs.forEach((input) => {
      if (input.dataset.captureEnhanced) return;
      input.dataset.captureEnhanced = "true";
      input.setAttribute("capture", "environment");
      const label = input.closest("label") || input.parentElement;
      if (label && !label.querySelector(".camera-save-hint")) {
        const hint = document.createElement("small");
        hint.className = "camera-save-hint";
        hint.textContent = "카메라로 찍은 사진의 갤러리 저장 여부는 기기/브라우저 설정을 따릅니다. 확실히 남기려면 카메라 앱으로 촬영 후 갤러리에서 선택하세요.";
        label.appendChild(hint);
      }
    });
  }

  function installPatch() {
    if (window.__workshopMediaExportPatch) return true;
    if (typeof render !== "function" || typeof state === "undefined" || typeof photos === "undefined") return false;

    installMediaExportStyle();
    const originalRender = render;
    render = function (...args) {
      const result = originalRender.apply(this, args);
      injectPanel();
      enhanceCaptureInputs();
      updatePanelSummary();
      return result;
    };

    window.downloadVisibleDayMedia = downloadVisibleDayMedia;
    window.__workshopMediaExportPatch = true;
    injectPanel();
    enhanceCaptureInputs();
    updatePanelSummary();
    return true;
  }

  if (!installPatch()) {
    const timer = setInterval(() => {
      if (installPatch()) clearInterval(timer);
    }, 80);
    setTimeout(() => clearInterval(timer), 10000);
  }
})();